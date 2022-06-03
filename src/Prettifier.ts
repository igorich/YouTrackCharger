import { ILogger, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import {
    BlockElementType,
    BlockType,
    ButtonStyle,
    IBlock,
    IContextBlock,
    IDividerBlock,
    ISectionBlock,
    TextObjectType } from "@rocket.chat/apps-engine/definition/uikit";
import { ISubscribeInfo } from "./definitions/ISubscribeInfo";
import { PersistenceService } from "./PersistenceService";
import { Utils } from "./Utils";
import { WorkItem } from "./definitions/WorkItem";

export class Prettifier {
    private static readonly targetUrlRegEx = /(http|https):\/\/(?<link>[\d\w\.]+)\/issue\/\w{2}-\d+/g;

    // Checks if the message should be "prettified"
    public static async reviewMessage(message: string | undefined, read: IRead, logger: ILogger): Promise<boolean> {
        if (message) {
            this.targetUrlRegEx.lastIndex = 0; // reset index before parsing
            const regExpMatches: RegExpExecArray | null = this.targetUrlRegEx.exec(message);
            const parsedBoardName: string | undefined = regExpMatches?.groups?.link;
            if(regExpMatches && parsedBoardName) {
                return await PersistenceService.checkIfDomainIsInAccessible(read, regExpMatches[0], parsedBoardName);
            }
        }
        logger.log(`Message <${message}> was rejected`);
        return false;
    }

    public static getApiUrlFromMessage(message: string): [string, string] {
        this.targetUrlRegEx.lastIndex = 0; // reset index.
        const match = this.targetUrlRegEx.exec(message);
        // https://raftds.youtrack.cloud/issue/RC-5
        // to
        // https://raftds.youtrack.cloud/api/issues/RC-5
        if (match) {
            return [match[0], match[0].replace("/issue/", "/api/issues/")];
        }
        return ["", ""]; // impossible due Prettifier.reviewMessage condition
        // throw exception in this case
    }

    public static getUrlDomain(url: string, withProtocol: boolean): string | undefined {
        const matches = /(https:\/\/|)(?<link>[\d\w\.\-]+\.\w{2,})/g.exec(url);

        if (matches) {
            if (withProtocol) {
                return matches[0];
            } else {
                return matches.groups?.link;
            }
        }

        return undefined;
    }

    public static pretty(workItem: WorkItem): Array<IBlock> {
        const header: ISectionBlock = {
            type: BlockType.SECTION,
            text: {
                type: TextObjectType.MARKDOWN,
                text: `${workItem.Title} - [${workItem.ID}](${workItem.URL})`,
            },
        };
        const divider: IBlock = { type: BlockType.DIVIDER };
        const desc: ISectionBlock = {
            type: BlockType.SECTION,
            text: {
                type: TextObjectType.MARKDOWN,
                text: `>  ${Utils.replaceAll(workItem.Description, '\n\n', '\n\n> ')}`, // add split by lines
            },
            accessory: {
                actionId: "btAction",
                type: BlockElementType.BUTTON,
                text: {
                    type: TextObjectType.PLAINTEXT,
                    text: "Open",
                },
                // value: "value string",
                url: workItem.URL,
                style: ButtonStyle.DANGER,
            },
        };
        const fields: Array<IContextBlock> = [];
        if(workItem.Priority) {
            fields.push({
                type: BlockType.CONTEXT,
                elements: [{
                    text: "Priority:",
                    type: TextObjectType.PLAINTEXT,
                }, {
                    text: workItem.Priority,
                    type: TextObjectType.PLAINTEXT,
                }],
            });
        }
        if(workItem.State) {
            fields.push({
                type: BlockType.CONTEXT,
                elements: [{
                    text: "State:",
                    type: TextObjectType.PLAINTEXT,
                }, {
                    text: workItem.State,
                    type: TextObjectType.PLAINTEXT,
                }],
            });
        }
        if(workItem.Project) {
            fields.push({
                type: BlockType.CONTEXT,
                elements: [{
                    text: "Project:",
                    type: TextObjectType.PLAINTEXT,
                }, {
                    text: workItem.Project,
                    type: TextObjectType.PLAINTEXT,
                }],
            });
        }
        if(workItem.Assignee) {
                fields.push({
                type: BlockType.CONTEXT,
                elements: [{
                    text: "Assignee:",
                    type: TextObjectType.PLAINTEXT,
                }, {
                    text: workItem.Assignee,
                    type: TextObjectType.PLAINTEXT,
                }],
            });
        }

        return [header/*, divider*/, desc, ... fields/*, actions*/];
    }

    public prettyList(list: Array<ISubscribeInfo>, title: string): Array<IBlock> {
        if (!list.length) {
            const block: ISectionBlock = {
                type: BlockType.SECTION,
                text: {
                    type: TextObjectType.PLAINTEXT,
                    text: "❌ You have no boards",
                    emoji: true,
                },
            };

            return [ block ];
        }

        const header: IContextBlock = {
            type: BlockType.CONTEXT,
            elements: [{
                type: TextObjectType.PLAINTEXT,
                text: `✅ ${title}:`,
                emoji: true,
            }],
        };
        const divider: IDividerBlock = {
            type: BlockType.DIVIDER,
        };
        const content: Array<IContextBlock> = new Array<IContextBlock>();
        list.forEach((item, indx, array) => {
            const line: IContextBlock = {
                type: BlockType.CONTEXT,
                elements: [{
                    type: TextObjectType.MARKDOWN,
                    text: `> ${indx + 1}. [${item.prefix}](${item.boardUrl})`,
                }],
            };

            content.push(line);
        });

        return [ header, /*divider,*/ ...content ];
    }
}
