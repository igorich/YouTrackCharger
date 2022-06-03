import { IPersistenceRead } from "@rocket.chat/apps-engine/definition/accessors";
import { RocketChatAssociationModel, RocketChatAssociationRecord } from "@rocket.chat/apps-engine/definition/metadata";
import { IBoardInfo } from "./definitions/IBoardInfo";
import { TypeAssociation } from "./definitions/TypeAssociation";

export class PersistenceChecker {
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
