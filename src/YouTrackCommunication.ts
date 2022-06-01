import { IHttp, ILogger, IPersistenceRead } from "@rocket.chat/apps-engine/definition/accessors";
import { PersistenceChecker } from "./PersistenceChecker";
import { Prettifier } from "./Prettifier";
import { WorkItem } from "./definitions/WorkItem";

export class YouTrackCommunication {
    private static readonly requestedFieldsFilter: string = "idReadable,project(name),summary,description,fields(projectCustomField(field(name)),value(name))";

    public static async getWorkItem(http: IHttp, url: string, persis: IPersistenceRead, logger: ILogger): Promise<WorkItem | undefined> {
        const apiUrl: string = url + `?fields=${YouTrackCommunication.requestedFieldsFilter}`;
        const domainName = Prettifier.getUrlDomain(url, true);
        if (!domainName) {
            return;
        }

        const authToken = await PersistenceChecker.tryGetAuthTokenByUrl(persis, domainName);
        if (!authToken) {
            return;
        }

        logger.log("getWorkItem request: ", apiUrl);
        try {
            const response = await http.get(apiUrl, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            let customFields = {};
            response.data.fields.map((entry) => {
                customFields[entry.projectCustomField.field.name] = entry.value?.name;
            });

            const workItem: WorkItem = {
                Project: response.data.project.name,
                Description: response.data.description ?? '',
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
            return undefined;
        }
    }
}
