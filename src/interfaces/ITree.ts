import { MessageTreeNode } from "../tree/MessageTreeNode";

export interface INodeCountTree {
    tree: MessageTreeNode;
    nodeCount: number;
}

export interface IMessageInfo {
    globalID: string;
    numberID: string | number;
    subject: string | null;
    sender: string | null;
    date: string | number;
    reference: string | null;
    groupName?: string;
}
