import { IHttp, IMessageBuilder, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from "@rocket.chat/apps-engine/definition/api";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { Utils } from "./Utils";
import { PersistenceService } from "./PersistenceService";

export class WebhookEndpoint extends ApiEndpoint {
    public async post(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<IApiResponse | undefined> {
        const username: string = request.content.username;
        const link: string = request.content.link;
        const subscriptionInfo = PersistenceService.getSubscriptionYtUsername(read, username, link);

        this.app.getLogger().debug(`Data received, request content ${JSON.stringify(request.content)}`);

        if (!subscriptionInfo) {
            this.app.getLogger().log("User or link not found in persistence.");
            return;
        }

        const directRoom: IRoom | undefined = await Utils.getDirect(read, modify, username, Utils.BOT_NAME, this.app.getLogger());
        const senderBot: IUser = await read.getUserReader().getByUsername(Utils.BOT_NAME);

        if (!this.validate(username, link, senderBot, directRoom, request)) {
            return this.success();
        }

        const message: IMessageBuilder = modify.getCreator().startMessage()
            .setSender(senderBot)
            .setRoom(directRoom!)
            .setText(`Hi! Your issue was updated: ${link}`);
        modify.getCreator().finish(message);

        return this.success();
    }

    private validate(username: string, link: string, senderBot: IUser, directRoom: IRoom | undefined, request: IApiRequest): boolean {
        if (!username || !link) {
            this.app.getLogger().debug(`Were not found both username and link in the request:\n${request}`);
            return false;
        }
        if (!senderBot) { // is it possible? getByUsername() did not support undefined
            this.app.getLogger().log(`An error occured during the reading the bot user`);
            return false;
        }
        if (!directRoom) {
            this.app.getLogger().debug(`Can't find or create a room within request ${request}`);
            return false;
        }

        return true;
    }
}
