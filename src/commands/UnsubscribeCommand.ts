import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { ISlashCommand, SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { IBoardInfo } from "../definitions/IBoardInfo";
import { PersistenceBoardsService } from "../PersistenceBoardsService";
import { PersistenceSubscriptionsService } from "../PersistenceSubscriptionsService";
import { Utils } from "../Utils";

export class UnsubscribeCommand implements ISlashCommand {
    public command: string = "yt-unsubscribe";
    public i18nParamsExample: string = "Unsubscribe_Params";
    public i18nDescription: string = "Unsubscribe_Desc";
    public permission?: string | undefined;
    public providesPreview: boolean = false;

    constructor(private readonly app: App) {}

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<void> {
        const args = context.getArguments();
        if (!args[0]) {
            this.app.getLogger().log("Error: No arguments.");
            return;
        }
        const domain = Utils.getUrlDomain(args[0], true);
        if (!domain) {
            this.app.getLogger().log("Warning: No URL in argument");
        }

        const creator = modify.getCreator();
        const messageBuilder = creator.startMessage();
        const sender = context.getSender();

        const board: IBoardInfo = await PersistenceBoardsService.getByUrlOrPrefix(read, domain, args[0].toUpperCase());
        await PersistenceSubscriptionsService.removeSubscription(persis, context, board.boardUrl);

        const [botSender, botRoom] = await Utils.getBotData(this.app, read, modify, sender);
        if (!botRoom) {
            this.app.getLogger().log("Error occured while get bot room.");
            return;
        }
        if (!botSender) {
            this.app.getLogger().log("Error occured while get bot user.");
            return;
        }

        messageBuilder
            .setText("You successfuly unsubscribe from YouTrack board")
            .setSender(botSender)
            .setRoom(botRoom);

        await creator.finish(messageBuilder);
    }
}
