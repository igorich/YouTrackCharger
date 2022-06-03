import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { ISlashCommand, SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { IBoardInfo } from "../definitions/IBoardInfo";
import { PersistenceService } from "../PersistenceService";
import { Prettifier } from "../Prettifier";

export class AddBoardCommand implements ISlashCommand {
    public command: string = "yt-add";
    public i18nParamsExample: string = "AddBoard_Params";
    public i18nDescription: string = "AddBoard_Desc";
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
        const sender = context.getSender();
        const room = context.getRoom();
        const creator = modify.getCreator();
        const messageBuilder = creator.startMessage();

        if (args.length < 3) {
            this.app.getLogger().log("Missing arguments.");
            messageBuilder
                .setText("Oops! Missing some arguments")
                .setSender(sender)
                .setRoom(room);
            return;
        }

        const domain = Prettifier.getUrlDomain(args[0], false);
        if (!domain) {
            this.app.getLogger().log("Incorrect URL.");
            messageBuilder
                .setText("The URL you provided is incorrect")
                .setSender(sender)
                .setRoom(room);
            return;
        }

        const dataObj: IBoardInfo = {
            boardUrl: `https://${domain}`,
            prefix: args[1],
            authToken: args[2],
        };

        // check if existed
        if (await PersistenceService.checkIfBoardExisted(read, dataObj.boardUrl)) {
            this.app.getLogger().log("URL exists");
            messageBuilder
                .setText("This URL has already been added. Operation denied.")
                .setSender(sender)
                .setRoom(room);

            await creator.finish(messageBuilder);
            return;
        }

        await PersistenceService.AddBoard(persis, dataObj);

        messageBuilder
            .setText("YouTrack board added in global list successfuly")
            .setSender(sender)
            .setRoom(room);

        await creator.finish(messageBuilder);
    }
}
