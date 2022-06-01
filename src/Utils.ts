import { ILogger, IModify, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IApp } from "@rocket.chat/apps-engine/definition/IApp";
import { IRoom, RoomType } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";

export class Utils {
    public static BOT_NAME: string = "youtrackcharger.bot";

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

    public static async getBotData(
        app: IApp,
        read: IRead,
        modify: IModify,
        sender: IUser): Promise<[IUser | undefined, IRoom | undefined]> {
        const botRoom = await Utils.getDirect(read, modify, sender.username, Utils.BOT_NAME, app.getLogger());
        const botSender = await read.getUserReader().getAppUser(app.getID());

        return [botSender, botRoom];

    }

    public static replaceAll(str: string, find: string, replace: string): string {
        return str.replace(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
      }

}
