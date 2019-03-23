// @ts-ignore
import {mimeWordsDecode} from 'emailjs-mime-codec';
import {IMessageInfo} from '../interfaces';

export const parseMessageInfo = (singleArticle: string[]): IMessageInfo => ({
    date: singleArticle[3],
    globalID: singleArticle[4],
    numberID: singleArticle[0],
    reference: singleArticle[5] !== '' ? singleArticle[5] : null,
    sender: mimeWordsDecode(singleArticle[2]),
    subject: mimeWordsDecode(singleArticle[1]),
});

const regexPattern = /\: (.+)/;
export const parseMessageHeader = (articleHeader: string[]): IMessageInfo => {
    const parsedLines = articleHeader.slice(0, 9);
    return {
        date: parsedLines[4].split(regexPattern)[1],
        globalID: parsedLines[7].split(regexPattern)[1],
        groupName: parsedLines[2].split(regexPattern)[1],
        numberID: parsedLines[7].split(regexPattern)[1],
        reference: parsedLines[8].split(regexPattern)[1] !== '' ? parsedLines[8].split(/\: /)[1] : null,
        sender: mimeWordsDecode(parsedLines[1].split(regexPattern)[1]),
        subject: mimeWordsDecode(parsedLines[3].split(regexPattern)[1]),
    };
};
