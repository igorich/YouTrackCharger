import { IHttp, IMessageBuilder, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from "@rocket.chat/apps-engine/definition/api";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { ISubscribeInfo } from "./definitions/ISubscribeInfo";
import { PersistenceSubscriptionsService } from "./PersistenceSubscriptionsService";
import { Utils } from "./Utils";

export class WebhookEndpoint extends ApiEndpoint {
    public path: string = "workItemChanged";

    public async post(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<IApiResponse | undefined> {
        const ytUsername: string = request.content.username;
        const link: string = request.content.link;
        const domain: string = Utils.getUrlDomain(link, true) ?? "";
        const subscriptionInfo: ISubscribeInfo | null = await PersistenceSubscriptionsService.getSubscriptionYtUsername(read, ytUsername, domain);

        this.app.getLogger().debug(`Data received, request content ${JSON.stringify(request.content)}`);

        if (!subscriptionInfo) {
            this.app.getLogger().log("User or link not found in persistence.");
            return;
        }

        const rcUser: IUser = await read.getUserReader().getById(subscriptionInfo.userId);
        const directRoom: IRoom | undefined = await Utils.getDirect(read, modify, rcUser.username, Utils.BOT_NAME, this.app.getLogger());
        const senderBot: IUser = await read.getUserReader().getByUsername(Utils.BOT_NAME);

        if (!this.validate(subscriptionInfo.userId, link, senderBot, directRoom, request)) {
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
