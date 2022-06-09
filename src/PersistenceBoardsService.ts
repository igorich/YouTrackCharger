import { IPersistence, IPersistenceRead, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { RocketChatAssociationModel, RocketChatAssociationRecord } from "@rocket.chat/apps-engine/definition/metadata";
import { IBoardInfo } from "./definitions/IBoardInfo";
import { ISubscribeInfo } from "./definitions/ISubscribeInfo";
import { TypeAssociation } from "./definitions/TypeAssociation";
import { PersistenceSubscriptionsService } from "./PersistenceSubscriptionsService";

export class PersistenceBoardsService {
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
        const isActive: boolean = await PersistenceSubscriptionsService.isSubscriptionPresentedInStorage(read, boardUrlOrPrefix);
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

    public static async tryGetAuthTokenByUrl(persis: IPersistenceRead, url: string): Promise<string | undefined> {
        const associations = [
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, url),
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TypeAssociation.LIST),
        ];

        const boardInfo = await persis.readByAssociations(associations);
        if (boardInfo.length > 0) {
            return (boardInfo[0] as IBoardInfo).authToken;
        }

        return undefined;
    }
}
