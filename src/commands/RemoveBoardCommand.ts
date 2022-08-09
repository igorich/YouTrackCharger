import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { ISlashCommand, SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { IBlock } from "@rocket.chat/apps-engine/definition/uikit";
import { ISubscribeInfo } from "../definitions/ISubscribeInfo";
import { PersistenceBoardsService } from "../PersistenceBoardsService";
import { PersistenceSubscriptionsService } from "../PersistenceSubscriptionsService";
import { Prettifier } from "../Prettifier";
import { Utils } from "../Utils";

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
        persis: IPersistence,
    ): Promise<void> {
        const creator = modify.getCreator();
        const prettifier = new Prettifier();
        const messageBuilder = creator.startMessage();
        const sender = context.getSender();
        const room = context.getRoom();
        const args = context.getArguments();
        const boardUrlOrPrefix = args[0];

        if (!boardUrlOrPrefix) {
            this.app.getLogger().log("Nothing to remove");
            return;
        }

        const isActive: boolean = await PersistenceSubscriptionsService.isSubscriptionPresentedInStorage(read, boardUrlOrPrefix);
        if (isActive) {
            Utils.logAndNotifyUser(
                "Current subscription had active subscribers. All subscriptions will be disabled.",
                this.app.getLogger(),
                messageBuilder,
                context,
            );

            await PersistenceSubscriptionsService.removeAllSubscriptionsForBoard(persis, boardUrlOrPrefix);
        }

        // TODO: Check the case when several boards were found when deleting by prefix
        const removeResult: boolean | Array<object> = await PersistenceBoardsService.removeByBoardUrlOrPrefix(persis, boardUrlOrPrefix);

        const message: Array<IBlock> = prettifier.prettyList(
            (removeResult as Array<object>).map((obj) => obj as ISubscribeInfo),
            "Removed boards");
        messageBuilder
            .addBlocks(message)
            .setSender(sender)
            .setRoom(room);

        await creator.finish(messageBuilder);
    }
}
