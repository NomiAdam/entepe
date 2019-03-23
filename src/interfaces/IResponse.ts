export interface IAction {
    command: string | any;
    multiline: boolean;
    success: number;
}

export interface IGroupResponse {
    status: number;
    numberOfArticles: number;
    firstArticleNumber: number;
    lastArticleNumber: number;
    nameOfTheGroup: string;
}

export interface IXoverArticles {
    NumberID: number;
    Subject: string;
    From: string;
    Date: string;
    MessageID: string;
    References: string;
    Bytes: string;
    Lines: string;
    Xreffull: string;
}
