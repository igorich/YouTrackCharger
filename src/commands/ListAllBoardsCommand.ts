import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { RocketChatAssociationModel, RocketChatAssociationRecord } from "@rocket.chat/apps-engine/definition/metadata";
import { ISlashCommand, SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { IBlock } from "@rocket.chat/apps-engine/definition/uikit";
import { ISubscribeInfo } from "../definitions/ISubscribeInfo";
import { TypeAssociation } from "../definitions/TypeAssociation";
import { Prettifier } from "../Prettifier";

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
        persis: IPersistence): Promise<void> {
        const creator = modify.getCreator();
        const messageBuilder = creator.startMessage();
        const sender = context.getSender();
        const room = context.getRoom();
        const persistenceReader = read.getPersistenceReader();
        const typeAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TypeAssociation.LIST);
        const prettifier = new Prettifier();

        const persistenceItems = await persistenceReader.readByAssociations([ typeAssociation ]);
        const boardList = persistenceItems.map((obj) => obj as ISubscribeInfo);
        const message: Array<IBlock> = prettifier.prettyList(boardList, "All boards");

        messageBuilder
            .addBlocks(message)
            .setSender(sender)
            .setRoom(room);

        await creator.finish(messageBuilder);
    }
}
