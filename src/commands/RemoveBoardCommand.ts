import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { RocketChatAssociationModel, RocketChatAssociationRecord } from "@rocket.chat/apps-engine/definition/metadata";
import { ISlashCommand, SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { IBlock } from "@rocket.chat/apps-engine/definition/uikit";
import { ISubscribeInfo } from "../definitions/ISubscribeInfo";
import { TypeAssociation } from "../definitions/TypeAssociation";
import { Prettifier } from "../Prettifier";

export class RemoveBoardCommand implements ISlashCommand {
    public command: string = "yt-remove";
    public i18nParamsExample: string = "RemoveBoard_Params";
    public i18nDescription: string = "RemoveBoard_Desc";
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
        const prettifier = new Prettifier();
        const messageBuilder = creator.startMessage();
        const sender = context.getSender();
        const room = context.getRoom();
        const args = context.getArguments();
        const param = args[0];

        if (!param) {
            this.app.getLogger().log("Nothing to remove");
            return;
        }

        const removeResult: boolean | Array<object> = await this.removeBy(param, read, persis);

        // TODO: Проверить случай, когда при удалении по префиксу нашлось несколько борд
        if (!removeResult) {
            this.app.getLogger().log("Remove board operation denied. Subscription is active.");
            messageBuilder
                .setText("Remove operation denied. Current subscribtion had active subscribers.")
                .setSender(sender)
                .setRoom(room);
        } else {
            const message: Array<IBlock> = prettifier.prettyList(
                (removeResult as Array<object>).map((obj) => obj as ISubscribeInfo),
                "Removed boards");
            messageBuilder
                .addBlocks(message)
                .setSender(sender)
                .setRoom(room);
        }

        await creator.finish(messageBuilder);
    }

    private async removeBy(
        argument: string,
        read: IRead,
        persis: IPersistence): Promise<boolean | Array<object>> {
        const isActive = await this.checkSubcription(argument, read);
        if (isActive) {
            return false;
        }

        const removed = await persis.removeByAssociations([
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, argument),
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TypeAssociation.LIST),
        ]);

        return removed;
    }

    private async checkSubcription(argument: string, read: IRead): Promise <number> {
        const persisRead = read.getPersistenceReader();
        const typeAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, TypeAssociation.SUBSCRIBE);
        const miscAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, argument);

        const subscriptions = await persisRead.readByAssociations([ miscAssociation, typeAssociation ]);

        return subscriptions.length;
    }
}
