import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { RocketChatAssociationModel, RocketChatAssociationRecord } from "@rocket.chat/apps-engine/definition/metadata";
import { ISlashCommand, SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { IBoardInfo } from "../definitions/IBoardInfo";
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
        if (!args[0]) {
            this.app.getLogger().log("Need argument");
            return;
        }
        let url = Utils.getUrlDomain(args[0], false);
        if (!url) {
            this.app.getLogger().log("Incorrect URL");
            return;
        }
        url = `https://${url}`;

        const persistenceReader = read.getPersistenceReader();
        const urlAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, url);
        //#region Check url in persis
        const persistenceItems = await persistenceReader.readByAssociation(urlAssociation);
        if (persistenceItems.length === 0) {
            this.app.getLogger().log("URL not found.");
            return;
        }
        //#endregion
        const prefix = (persistenceItems[0] as IBoardInfo)?.prefix;

        await PersistenceSubscriptionsService.addSubscription(persis, sender.id, url, prefix);

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
            .setText("You successfuly subscribe on YouTrack board") // TODO: ?????????????? ???????????????? ?? ?????????????????? ?????????? ?? ??????????????
            .setSender(botSender)
            .setRoom(botRoom);

        await creator.finish(messageBuilder);
    }
}
