import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { ISlashCommand, SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { IBoardInfo } from "../definitions/IBoardInfo";
import { ISubscribeInfo } from "../definitions/ISubscribeInfo";
import { PersistenceBoardsService } from "../PersistenceBoardsService";
import { PersistenceSubscriptionsService } from "../PersistenceSubscriptionsService";
import { Utils } from "../Utils";

export class SubscribeCommand implements ISlashCommand {
    public command: string = "yt-subscribe";
    public i18nParamsExample: string = "Subscribe_Params";
    public i18nDescription: string = "Subscribe_Desc";
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
        const creator = modify.getCreator();
        const messageBuilder = creator.startMessage();
        const sender = context.getSender();
        const args = context.getArguments();
        let okMessage: string;
        if (!args[0]) {
            this.app.getLogger().log("Error: No arguments.");
            return;
        }
        const url = Utils.getUrlDomain(args[0], true);
        if (!url) {
            this.app.getLogger().log("Warning: No URL in argument");
        }

        const board: IBoardInfo = await PersistenceBoardsService.getByUrlOrPrefix(read, url, args[0].toUpperCase());

        // optional argument, if is not set - YT name is same as in RC
        const ytUsername = args[1] ?? sender.username;

        const existedSubscription: ISubscribeInfo | undefined = await PersistenceSubscriptionsService.tryGetSubscriptionInfo(
            read.getPersistenceReader(),
            sender.id,
            board.boardUrl,
            board.prefix);
        if (existedSubscription) {
            okMessage = "You already subscribed on current board";
        } else {
            await PersistenceSubscriptionsService.addSubscription(persis, sender.id, board.boardUrl, board.prefix, ytUsername);
            okMessage = "You successfuly subscribe on YouTrack board";
        }

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
            .setText(okMessage) // TODO: Сделать карточку с перфиксом борды и ссылкой
            .setSender(botSender)
            .setRoom(botRoom);

        await creator.finish(messageBuilder);
    }
}
