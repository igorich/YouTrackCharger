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
import { WorkItem } from "./definitions/WorkItem";
import { Utils } from "./Utils";

export class Prettifier {

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
                text: `>  ${Utils.replaceAll(workItem.Description, "\n\n", "\n\n> ")}`, // add split by lines
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
        if (workItem.Priority) {
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
        if (workItem.State) {
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
        if (workItem.Project) {
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
        if (workItem.Assignee) {
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
                    text: `> ${indx + 1}. [${item.prefix}](${item.boardUrl}) for user ${item.youTrackUserName}`,
                }],
            };

            content.push(line);
        });

        return [ header, /*divider,*/ ...content ];
    }
}
