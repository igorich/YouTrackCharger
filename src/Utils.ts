import { ILogger, IModify, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IApp } from "@rocket.chat/apps-engine/definition/IApp";
import { IRoom, RoomType } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { PersistenceBoardsService } from "./PersistenceBoardsService";

export class Utils {
    public static BOT_NAME: string = "youtrackcharger.bot";
    private static readonly targetUrlRegEx = /(http|https):\/\/(?<link>[\d\w\.]+)\/issue\/\w{2}-\d+/g;

    public static async getDirect(read: IRead, modify: IModify, username: string, botName: string, logger: ILogger): Promise<IRoom | undefined> {
        let room: IRoom;
        try {
            room = await read.getRoomReader().getDirectByUsernames([username, botName]);
        } catch (error) {
            logger.log(`An error occured during the reading a room for ${username} and ${botName}`);
            return undefined;
        }

        if (room) {
            return room;
        } else {
            const botUser: IUser = await read.getUserReader().getByUsername(botName);
            if (botUser) {
                const newRoom = modify.getCreator().startRoom()
                    .setType(RoomType.DIRECT_MESSAGE)
                    .setCreator(botUser)
                    .setMembersToBeAddedByUsernames([username, botName]);
                const roomId: string = await modify.getCreator().finish(newRoom);
                return await read.getRoomReader().getById(roomId);
            } else {
                logger.log(`An error occured during the reading the bot user`);
                return undefined;
            }
        }
    }

    public static getUrlDomain(url: string, withProtocol: boolean): string | undefined {
        const matches = /(https:\/\/|)(?<link>[\d\w\.\-]+\.\w{2,})/g.exec(url);

        if (matches) {
            if (withProtocol) {
                return matches[0];
            } else {
                return matches.groups?.link;
            }
        }

        return undefined;
    }

    public static getApiUrlFromMessage(message: string): [string, string] {
        this.targetUrlRegEx.lastIndex = 0; // reset index.
        const match = this.targetUrlRegEx.exec(message);
        // https://raftds.youtrack.cloud/issue/RC-5
        // to
        // https://raftds.youtrack.cloud/api/issues/RC-5
        if (match) {
            return [match[0], match[0].replace("/issue/", "/api/issues/")];
        }
        return ["", ""]; // impossible due Prettifier.reviewMessage condition
        // throw exception in this case
    }

    // Checks if the message should be "prettified"
    public static async reviewMessage(message: string | undefined, read: IRead, logger: ILogger): Promise<boolean> {
        if (message) {
            this.targetUrlRegEx.lastIndex = 0; // reset index before parsing
            const regExpMatches: RegExpExecArray | null = this.targetUrlRegEx.exec(message);
            const parsedBoardName: string | undefined = regExpMatches?.groups?.link;
            if (regExpMatches && parsedBoardName) {
                return await PersistenceBoardsService.checkIfDomainIsInAccessible(read, regExpMatches[0], parsedBoardName);
            }
        }
        logger.log(`Message <${message}> was rejected`);
        return false;
    }

    public static async getBotData(
        app: IApp,
        read: IRead,
        modify: IModify,
        sender: IUser,
    ): Promise<[IUser | undefined, IRoom | undefined]> {
        const botRoom = await Utils.getDirect(read, modify, sender.username, Utils.BOT_NAME, app.getLogger());
        const botSender = await read.getUserReader().getAppUser(app.getID());

        return [botSender, botRoom];

    }

    public static replaceAll(str: string, find: string, replace: string): string {
        return str.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), replace);
    }

}
