import { IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { RocketChatAssociationModel, RocketChatAssociationRecord } from "@rocket.chat/apps-engine/definition/metadata";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { IBoardInfo } from "./definitions/IBoardInfo";
import { ISubscribeInfo } from "./definitions/ISubscribeInfo";
import { TypeAssociation } from "./definitions/TypeAssociation";

export class PersistenceService {

    public static async addSubscription(
        persis: IPersistence,
        senderId: string,
        boardUrl: string,
        prefix: string,
        youTrackUserName: string,
    ) {
        const userAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, senderId);
        const urlAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, boardUrl);
        const prefixAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, prefix);
        const youtrackAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, youTrackUserName);
        const typeAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TypeAssociation.SUBSCRIBE);

        const dataObj: ISubscribeInfo = {
            userId: senderId,
            youTrackUserName,
            boardUrl,
            prefix,
        };

        await persis.createWithAssociations(dataObj, [ userAssociation, urlAssociation, prefixAssociation, typeAssociation, youtrackAssociation ]);
    }

    public static async getSubscriptionYtUsername(
        read: IRead,
        ytUsername: string,
        url: string,
    ): Promise<ISubscribeInfo | null> {
        const associations = [
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, ytUsername),
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, url),
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TypeAssociation.SUBSCRIBE),
        ];

        const persisRead = read.getPersistenceReader();
        const subscriptionData = await persisRead.readByAssociations(associations);
        if (subscriptionData.length > 0) {
            return subscriptionData[0] as ISubscribeInfo;
        }

        return null;
    }

    public static  async removeSubscription(persis: IPersistence, context: SlashCommandContext, boardUrl: string) {
        const sender = context.getSender();
        const keyAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, sender.id);
        const urlAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, boardUrl);
        const typeAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TypeAssociation.SUBSCRIBE);

        await persis.removeByAssociations([ keyAssociation, urlAssociation, typeAssociation ]);
    }

    public static async getAllSubscriptions(read: IRead, senderId: string): Promise<Array<ISubscribeInfo>> {
        const persistenceReader = read.getPersistenceReader();
        const keyAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, senderId);
        const typeAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TypeAssociation.SUBSCRIBE);

        const persistenceItems = await persistenceReader.readByAssociations([ keyAssociation, typeAssociation ]);
        return persistenceItems.map((obj) => obj as ISubscribeInfo);
    }

    private static async isSubscriptionPresentedInStorage(read: IRead, boardUrl: string): Promise<boolean> {
        const persisRead = read.getPersistenceReader();
        const miscAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, boardUrl);
        const typeAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TypeAssociation.SUBSCRIBE);

        const subscriptions = await persisRead.readByAssociations([ miscAssociation, typeAssociation ]);

        return (subscriptions.length > 0);
    }

    public static async AddBoard(persis: IPersistence, dataObj: IBoardInfo) {
        const urlAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, dataObj.boardUrl);
        const prefixAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, dataObj.prefix);
        const typeAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TypeAssociation.LIST);

        await persis.createWithAssociations(dataObj, [ urlAssociation, prefixAssociation, typeAssociation ]);
    }

    public static async removeByBoardUrlOrPrefix(
        persis: IPersistence,
        read: IRead,
        boardUrlOrPrefix: string,
    ): Promise<boolean | Array<object>> {
        const isActive: boolean = await PersistenceService.isSubscriptionPresentedInStorage(read, boardUrlOrPrefix);
        if (isActive) {
            return false;
        }

        const removed = await persis.removeByAssociations([
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, boardUrlOrPrefix),
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TypeAssociation.LIST),
        ]);

        return removed;
    }

    public static async getAllBoards(read: IRead): Promise<Array<ISubscribeInfo>> {
        const persistenceReader = read.getPersistenceReader();
        const typeAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TypeAssociation.LIST);

        const list = await persistenceReader.readByAssociations([ typeAssociation ]);

        return list.map((obj) => obj as ISubscribeInfo);
    }

    // Checks if the URI from the message matches the conditions
    public static async checkIfDomainIsInAccessible(read: IRead, messageURI: string, boardName: string): Promise<boolean> {
        if (messageURI.includes("/issue/")) {
            const typeAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TypeAssociation.LIST);
            const persistenceItems = await read.getPersistenceReader().readByAssociations([ typeAssociation ]);
            // need to check if a board name in the global list of boards
            for (const obj of persistenceItems) {
                if ((obj as ISubscribeInfo).boardUrl.includes(boardName)) {
                    return true;
                }
            }
        }
        return false;
    }

    public static async checkIfBoardExisted(read: IRead, domain: string) {
        const result = await read.getPersistenceReader().readByAssociations([
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, domain),
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TypeAssociation.LIST),
        ]);

        return (result.length > 0);
    }
}
