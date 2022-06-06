import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { ISlashCommand, SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { IBlock } from "@rocket.chat/apps-engine/definition/uikit";
import { ISubscribeInfo } from "../definitions/ISubscribeInfo";
import { PersistenceService} from "../PersistenceService";
import { Prettifier } from "../Prettifier";
import { Utils } from "../Utils";

export class BoardListCommand implements ISlashCommand {
    public command: string = "yt-my-list";
    public i18nParamsExample: string = "";
    public i18nDescription: string = "BoardList_Desc";
    public permission?: string | undefined;
    public providesPreview: boolean = false;

    constructor(private readonly app: App) { }

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
        const prettifier = new Prettifier();

        const boardList: Array<ISubscribeInfo> = await PersistenceService.getAllSubscriptions(read, sender.id);

        const message: Array<IBlock> = prettifier.prettyList(boardList, "My boards");
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
            .addBlocks(message)
            .setSender(botSender)
            .setRoom(botRoom);

        await creator.finish(messageBuilder);
    }
}
