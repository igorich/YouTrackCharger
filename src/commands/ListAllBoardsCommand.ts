import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { ISlashCommand, SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { IBlock } from "@rocket.chat/apps-engine/definition/uikit";
import { Prettifier } from "../Prettifier";
import { PersistenceService } from "../PersistenceService";

export class ListAllBoardsCommand implements ISlashCommand {
    public command: string = "yt-list";
    public i18nParamsExample: string = "";
    public i18nDescription: string = "ListAllBoards_Desc";
    public permission?: string | undefined;
    public providesPreview: boolean = false;

    constructor(private readonly app: App) { }

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        const creator = modify.getCreator();
        const messageBuilder = creator.startMessage();
        const sender = context.getSender();
        const room = context.getRoom();
        const prettifier = new Prettifier();

        const boardList = await PersistenceService.getAllBoards(read);
        const message: Array<IBlock> = prettifier.prettyList(boardList, "All boards");

        messageBuilder
            .addBlocks(message)
            .setSender(sender)
            .setRoom(room);

        await creator.finish(messageBuilder);
    }
}
