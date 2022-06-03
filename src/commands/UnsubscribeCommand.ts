import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { ISlashCommand, SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { Prettifier } from "../Prettifier";
import { Utils } from "../Utils";
import {PersistenceService} from "../PersistenceService";

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
        persis: IPersistence
    ): Promise<void> {
        const args = context.getArguments();
        if (!args[0]) {
            this.app.getLogger().log("URL undefined");
            return;
        }
        let domain = Prettifier.getUrlDomain(args[0], false);
        if (!domain) {
            this.app.getLogger().log("Incorrect URL");
            return;
        }
        domain = `https://${domain}`;

        const creator = modify.getCreator();
        const messageBuilder = creator.startMessage();
        const sender = context.getSender();

        await PersistenceService.removeSubscription(persis, context, domain);

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
