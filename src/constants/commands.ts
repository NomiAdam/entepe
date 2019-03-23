export const CRLF = '\r\n';

const commandActions = {
    getGroup: {
        command: (group: string) => `GROUP ${group}${CRLF}`,
        multiline: false,
        success: 211,
    },
    getArticleHead: {
        command: (messageID: string) => `HEAD ${messageID}${CRLF}`,
        multiline: true,
        success: 221,
    },
    getArticleBody: {
        command: (messageID: string) => `ARTICLE ${messageID}${CRLF}`,
        multiline: true,
        success: 220,
    },
    listGroupArticles: {
        command: (group: string) => `LISTGROUP  ${group}${CRLF}`,
        multiline: true,
        success: 211,
    },
    overRange: {
        command: (from: number, to: number) => `OVER  ${from}-${to}${CRLF}`,
        multiline: true,
        success: 224,
    },
    nextArticle: {
        command: `NEXT${CRLF}`,
        multiline: false,
        success: 223,
    },
    prevArticle: {
        command: `LAST${CRLF}`,
        multiline: false,
        success: 223,
    },
    postArticleFirstPhase: {
        command: `POST${CRLF}`,
        multiline: false,
        success: 340,
    },
    postArticleSecondPhase: {
        command: (articleToBePosted: string) => `${articleToBePosted}`,
        multiline: false,
        success: 240,
    },
    listGroups: {
        command: `LIST${CRLF}`,
        multiline: true,
        success: 215,
    },
    quit: {
        command: `QUIT${CRLF}`,
        multiline: false,
        success: 205,
    },
    getOverview: {
        command: `LIST OVERVIEW.FMT${CRLF}`,
        multiline: true,
        success: 215,
    },
    listArticles: {
        command: (from: number, to: number) => `XOVER ${from}-${to}${CRLF}`,
        multiline: true,
        success: 224,
    },
    listNewArticles: {
        command: (wildmat: string, dateTime: string) => `NEWNEWS ${wildmat} ${dateTime} GMT${CRLF}`,
        multiline: true,
        success: 230,
    },
    listNewGroups: {
        command: (wildmat: string, dateTime: string) => `NEWGROUPS ${dateTime} GMT${CRLF}`,
        multiline: true,
        success: 231,
    },
    getArticleInformation: {
        command: (numberID: number) => `OVER ${numberID}${CRLF}`,
        multiline: true,
        success: 224,
    },
    checkArticleExistence: {
        command: (messageID: string) => `STAT ${messageID}${CRLF}`,
        multiline: false,
        success: 223,
    },
};

export default commandActions;
