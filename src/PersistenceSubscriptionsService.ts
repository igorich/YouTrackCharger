import { IPersistence, IPersistenceRead, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { RocketChatAssociationModel, RocketChatAssociationRecord } from "@rocket.chat/apps-engine/definition/metadata";
import { SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { ISubscribeInfo } from "./definitions/ISubscribeInfo";
import { TypeAssociation } from "./definitions/TypeAssociation";

export class PersistenceSubscriptionsService {

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

    public static  async removeSubscription(persis: IPersistence, context: SlashCommandContext, boardUrl: string) {
        const sender = context.getSender();
        const keyAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, sender.id);
        const urlAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, boardUrl);
        const typeAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TypeAssociation.SUBSCRIBE);

        await persis.removeByAssociations([ keyAssociation, urlAssociation, typeAssociation ]);
    }

    public static async tryGetSubscriptionInfo(
        persis: IPersistenceRead,
        senderId: string,
        boardUrl: string,
        prefix: string,
    ): Promise<ISubscribeInfo | undefined> {
        const associations = [
            new RocketChatAssociationRecord(RocketChatAssociationModel.USER, senderId),
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, boardUrl),
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, prefix),
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TypeAssociation.SUBSCRIBE),
        ];

        const subscribtionData = await persis.readByAssociations(associations);
        if (subscribtionData.length > 0) {
            return subscribtionData[0] as ISubscribeInfo;
        }

        return undefined;
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

    public static async getAllSubscriptions(read: IRead, senderId: string): Promise<Array<ISubscribeInfo>> {
        const persistenceReader = read.getPersistenceReader();
        const keyAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, senderId);
        const typeAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TypeAssociation.SUBSCRIBE);

        const persistenceItems = await persistenceReader.readByAssociations([ keyAssociation, typeAssociation ]);
        return persistenceItems.map((obj) => obj as ISubscribeInfo);
    }

    public static async isSubscriptionPresentedInStorage(read: IRead, boardUrl: string): Promise<boolean> {
        const persisRead = read.getPersistenceReader();
        const miscAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, boardUrl);
        const typeAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TypeAssociation.SUBSCRIBE);

        const subscriptions = await persisRead.readByAssociations([ miscAssociation, typeAssociation ]);

        return (subscriptions.length > 0);
    }

    public static async removeAllSubscriptionsForBoard(persis: IPersistence, boardUrlOrPrefix: string) {
        const urlAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, boardUrlOrPrefix);
        const typeAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TypeAssociation.SUBSCRIBE);

        await persis.removeByAssociations([ urlAssociation, typeAssociation ]);
    }
}
