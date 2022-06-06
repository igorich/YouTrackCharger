import {
    IAppAccessors,
    IConfigurationExtend,
    IEnvironmentRead,
    IHttp,
    ILogger,
    IMessageBuilder,
    IPersistence,
    IRead} from "@rocket.chat/apps-engine/definition/accessors";
import { ApiSecurity, ApiVisibility } from "@rocket.chat/apps-engine/definition/api";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { IMessage, IPreMessageSentModify } from "@rocket.chat/apps-engine/definition/messages";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";
import { ISlashCommand } from "@rocket.chat/apps-engine/definition/slashcommands";
import { BlockType, ISectionBlock, TextObjectType } from "@rocket.chat/apps-engine/definition/uikit";
import { AddBoardCommand } from "./src/commands/AddBoardCommand";
import { BoardListCommand } from "./src/commands/BoardListCommand";
import { ListAllBoardsCommand } from "./src/commands/ListAllBoardsCommand";
import { RemoveBoardCommand } from "./src/commands/RemoveBoardCommand";
import { SubscribeCommand } from "./src/commands/SubscribeCommand";
import { UnsubscribeCommand } from "./src/commands/UnsubscribeCommand";
import { WorkItem } from "./src/definitions/WorkItem";
import { Prettifier } from "./src/Prettifier";
import { WebhookEndpoint } from "./src/WebhookEndpoint";
import { YouTrackCommunication } from "./src/YouTrackCommunication";

export class YouTrackChargerApp extends App implements IPreMessageSentModify {

    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    protected async extendConfiguration(configuration: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        configuration.api.provideApi({
            visibility: ApiVisibility.PUBLIC,
            security: ApiSecurity.UNSECURE,
            endpoints: [
                new WebhookEndpoint(this),
            ],
        });

        const slashCommands: Array<ISlashCommand> = [
            new AddBoardCommand(this),
            new ListAllBoardsCommand(this),
            new BoardListCommand(this),
            new SubscribeCommand(this),
            new UnsubscribeCommand(this),
            new RemoveBoardCommand(this),
        ];

        for (const slashCommand of slashCommands) {
            await configuration.slashCommands.provideSlashCommand(slashCommand);
        }
    }

    public async initialize(configurationExtend: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        await this.extendConfiguration(configurationExtend, environmentRead);
        this.getLogger().log("YouTrackCharger v.0.0.2 is initialized");
    }

    public async checkPreMessageSentModify(message: IMessage, read: IRead, http: IHttp): Promise<boolean> {
        return Prettifier.reviewMessage(message.text, read, this.getLogger());
    }

    public async executePreMessageSentModify(
        message: IMessage,
        builder: IMessageBuilder,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
    ): Promise<IMessage> {
        const workItem = await this.getWorkItem(http, read, message.text);
        if (workItem !== null) {
            if (message.text && message.text?.length > workItem.URL.length) {
                const baseBody: ISectionBlock = {
                    type: BlockType.SECTION,
                    text: {
                        type: TextObjectType.MARKDOWN,
                        text: message.text!,
                    },
                };
                builder.setBlocks([baseBody]);
            }

            builder.addBlocks(Prettifier.pretty(workItem));
        }
        return builder.getMessage();
    }

    private async getWorkItem(http: IHttp, read: IRead, text: string | undefined): Promise<WorkItem | null> {
        if (text === undefined) {
            return null;
            // impossible due Prettifier.reviewMessage condition
            // throw exception in this case
        }
        const [link, apiLink] = Prettifier.getApiUrlFromMessage(text);
        const persisRead = read.getPersistenceReader();

        const workItem = await YouTrackCommunication.getWorkItem(http, apiLink, persisRead, this.getLogger());
        if (workItem) {
            workItem.URL = link;
        }
        return workItem;
    }
}
