import { IHttp, ILogger, IPersistenceRead } from "@rocket.chat/apps-engine/definition/accessors";
import { WorkItem } from "./definitions/WorkItem";
import { PersistenceBoardsService } from "./PersistenceBoardsService";
import { Utils } from "./Utils";

export class YouTrackCommunication {
    private static readonly requestedFieldsFilter: string = "idReadable,project(name),summary,description,fields(projectCustomField(field(name)),value(name))";

    public static async getWorkItem(http: IHttp, url: string, persis: IPersistenceRead, logger: ILogger): Promise<WorkItem | null> {
        const apiUrl: string = url + `?fields=${YouTrackCommunication.requestedFieldsFilter}`;
        const domainName = Utils.getUrlDomain(url, true);
        if (!domainName) {
            return null;
        }

        const authToken = await PersistenceBoardsService.tryGetAuthTokenByUrl(persis, domainName);
        if (!authToken) {
            return null;
        }

        logger.log("getWorkItem request: ", apiUrl);
        try {
            const response = await http.get(apiUrl, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            const customFields: object = {};
            response.data.fields.map((entry) => {
                customFields[entry.projectCustomField.field.name] = entry.value?.name;
            });

            const workItem: WorkItem = {
                Project: response.data.project.name,
                Description: response.data.description ?? "",
                Title: response.data.summary,
                ID: response.data.idReadable,
                URL: url,
                Priority: customFields["Priority"],
                State: customFields["State"],
                Type: customFields["Type"],
                Assignee: customFields["Assignee"],
                Subsystem: "",
                FixVersions: "",
                AffectedVersions: "",
                FixedInBuild: "",
            };
            return workItem;
        } catch (exception) {
            logger.log(`ERROR received from ${apiUrl}: ${exception}\n`);
            return null;
        }
    }
}
