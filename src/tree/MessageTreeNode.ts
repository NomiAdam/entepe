import { IMessageInfo } from '../interfaces';

export class MessageTreeNode {

    private depth: number;
    private messageInfo: IMessageInfo | null;
    private readonly children: any;

    constructor(messageInfo: IMessageInfo | null = null, depth: number = 0) {
        this.depth = depth;
        this.messageInfo = messageInfo;
        this.children = {};
    }

    public getAllChildren(): any {
      return this.children;
    }

    public getMessageInfo(): IMessageInfo | null {
        return this.messageInfo;
    }

    public getIncrementedDepth(): number {
        return this.depth + 1;
    }

    public setMessageInfo(messageInfo: IMessageInfo): void {
        this.messageInfo = messageInfo;
    }

    public setDecrementedDepth(): void {
        this.depth = this.depth - 1;
    }

    public setChildren(key: string, children: MessageTreeNode): void {
        this.children[key] = children;
    }

    public getChildren(key: string): MessageTreeNode {
        return this.children[key] || null;
    }

    public getChildrenKeys(): string[] {
        return Object.keys(this.children);
    }

    public getChildrenCount(): number {
        return Object.keys(this.children).length;
    }

    public getTreeKeys(): string[] {
        const keyAry = [];
        const childrenKeys = this.getChildrenKeys();
        keyAry.push(...childrenKeys);
        for (const key of childrenKeys) {
            keyAry.push(...this.getChildren(key).getTreeKeys());
        }
        return keyAry;
    }

    public getTreeCount(): number {
        const childrenKeys = this.getChildrenKeys();
        let childCount = this.getChildrenCount();
        for (const key of childrenKeys) {
            childCount += this.getChildren(key).getTreeCount();
        }
        return childCount;
    }

    public insertMessageInfo(messageInfo: IMessageInfo): void {
        let node: MessageTreeNode = this;
        if (messageInfo.reference === null) {
            node.setChildren(messageInfo.globalID, new MessageTreeNode(
                messageInfo,
                node.getIncrementedDepth(),
                ),
            );
        } else {
            const references = messageInfo.reference.split(' ');
            for (const reference of references) {
                const tmpNode: MessageTreeNode = node.getChildren(reference);
                if (tmpNode === null) {
                    const placeholderMessage = {
                        date: 0,
                        globalID: reference,
                        numberID: -1,
                        reference,
                        sender: null,
                        subject: null,
                    };
                    node.setChildren(reference, new MessageTreeNode(
                        placeholderMessage,
                        node.getIncrementedDepth(),
                        ),
                    );
                    node = node.getChildren(reference);
                } else {
                    node = tmpNode;
                }
            }
            let child = node.getChildren(messageInfo.globalID);
            if (child === null) {
                child = new MessageTreeNode(messageInfo, node.getIncrementedDepth());
            } else {
                child.setMessageInfo(messageInfo);
            }
            node.setChildren(messageInfo.globalID, child);
        }
    }

    public removeInvalidNodes(): void {
        const childrenKeys: string[] = this.getChildrenKeys();
        for (const childKey of childrenKeys) {
            const child: MessageTreeNode = this.getChildren(childKey);
            child.removeInvalidNodes();
            const information: any = child.getMessageInfo();
            if (information.numberID === -1) {
                // Remove the children and promote others
                const keys = child.getChildrenKeys();
                for (const key of keys) {
                    const tempNode: MessageTreeNode = child.getChildren(key);
                    tempNode.setDecrementedDepth();
                    this.setChildren(key, tempNode);
                }
                delete this.children[childKey];
            }
        }
    }

}
