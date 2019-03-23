import { simpleParser } from 'mailparser';
import * as net from 'net';
import commandActions, { CRLF } from './constants/commands';
import { IAction, IGroupResponse, INodeCountTree, IXoverArticles } from './interfaces';
import { MultiStreamReader } from './pipeline/multiLineStream';
import { SingleStreamReader } from './pipeline/singleLineStream';
import { MessageTreeNode } from './tree/MessageTreeNode';
import { IMessageInfo } from './interfaces';
import CustomError from './utils/errorHandler';
import { parseMessageHeader, parseMessageInfo } from './utils/parseMessageInfo';
import Response from './utils/response';
import { ConstructorProps, Connection, PostType } from './types';
// @ts-ignore
import MailComposer from "nodemailer/lib/mail-composer";

export default class NNTP {

    private socket: net.Socket;
    private readonly host: string | undefined;
    private readonly port: number;
    private encoding?: string;
    private postingAllowed: boolean;
    private isConnected: boolean;

    private connectionInformation: Connection;

    constructor(options: ConstructorProps) {
        // @ts-ignore
        this.socket = undefined;
        this.host = options.host || undefined;
        this.port = options.port || 119;
        this.encoding = options.encoding || 'UTF8';
        this.isConnected = false;
        this.postingAllowed = false;
        this.connectionInformation = {};
    }

    public async connect(): Promise<Response> {
        this.socket = net.connect({port: this.port, host: this.host});
        const response: Response = await this.getResponse(false);
        this.connectionInformation = {
            response: response.response,
            status: response.status,
        };
        if (response.status === 200) {
            this.postingAllowed = true;
        }
        this.isConnected = true;
        return response;
    }

    /**
     * Returns the welcome message sent by the server in reply to initial connection
     * It may contain disclaimers or help information that may be relevant for the user
     *
     * @returns {string}
     */
    public getWelcome() {
        return this.connectionInformation.response;
    }

    /**
     * Get group information by group name
     * On success returns status 211
     * On error returns status 411
     * https://tools.ietf.org/html/rfc3977#section-6.1.1
     *
     * @param {string} group
     * @returns {Promise<IGroupResponse>}
     */
    public async getGroup(group: string): Promise<IGroupResponse> {
        const action: IAction = commandActions.getGroup;

        this.socket.write(action.command(group));
        const response: Response = await this.getResponse(action.multiline);

        if (response.status === action.success) {
            const responseData = response.response.split(' ');
            return {
                firstArticleNumber: parseInt(responseData[1], 10),
                lastArticleNumber: parseInt(responseData[2], 10),
                nameOfTheGroup: responseData[3],
                numberOfArticles: parseInt(responseData[0], 10),
                status: response.status,
            };
        } else {
            throw new CustomError(response.status);
        }
    }

    /**
     * Get list of articles numberIDs in current group
     * On success returns status 211
     * On error returns status 411
     * https://tools.ietf.org/html/rfc3977#section-6.1.2
     *
     * @param {string} group
     * @returns {Promise<string[]>}
     */
    public async listGroupArticles(group: string): Promise<string[]> {
        const action: IAction = commandActions.listGroupArticles;
        this.socket.write(action.command(group));
        const response: Response = await this.getResponse(action.multiline);
        if (response.status === action.success) {
            return response.getLines();
        } else {
            throw new CustomError(response.status);
        }
    }

    /**
     * Returns MIME formatted ARTICLE body
     * On success returns status 220
     * On error returns status 430
     * https://tools.ietf.org/html/rfc3977#section-6.2.1
     *
     * @param {string} messageID
     */
    public async getArticleBody(messageID: string): Promise<{ html: string, raw: string, attachments: any }> {
        const action: IAction = commandActions.getArticleBody;
        this.socket.write(action.command(messageID));
        const response: Response = await this.getResponse(action.multiline);
        if (response.status === action.success) {
            const parsed = await simpleParser(response.getLines().join('\r\n'));
            return { html: parsed.textAsHtml, raw: parsed.text, attachments: parsed.attachments };
        } else {
            throw new CustomError(response.status);
        }
    }

    /**
     * Behaviour is identical to the ARTICLE command, expect only headers are present
     * On success returns status 221
     * On error returns status 430
     * https://tools.ietf.org/html/rfc3977#section-6.2.2
     *
     * @param {string} messageID
     * @returns {Promise<MessageInfo>}
     */
    public async getArticleHead(messageID: string): Promise<IMessageInfo> {
        const action: IAction = commandActions.getArticleHead;
        this.socket.write(action.command(messageID));
        const response: Response = await this.getResponse(action.multiline);
        if (response.status === action.success) {
            return parseMessageHeader(response.getLines());
        } else {
            throw new CustomError(response.status);
        }
    }

    /**
     * Get next article in given group, note that group must be selected beforehand
     * On success returns status 223
     * On error returns 421
     * https://tools.ietf.org/html/rfc3977#section-6.1.4
     *
     * @returns {Promise<Response>}
     */
    // @ts-ignore
    public async nextArticle(): Promise<Response> {
        const action: IAction = commandActions.nextArticle;
        this.socket.write(action.command);
        const response: Response = await this.getResponse(action.multiline);
        if (response.status === action.success) {
            return response;
        } else {
            throw new CustomError(response.status);
        }

    }

    /**
     * Get previous article in given group, note that group must be selected beforehand
     * On success returns status 223
     * On error returns status 422
     * https://tools.ietf.org/html/rfc3977#section-6.1.3
     *
     * @returns {Promise<Response>}
     */
    public async prevArticle(): Promise<Response> {
        const action: IAction = commandActions.prevArticle;
        this.socket.write(action.command);
        const response: Response = await this.getResponse(action.multiline);
        if (response.status === action.success) {
            return response;
        } else {
            throw new CustomError(response.status);
        }
    }

    /**
     * Post an article with given parameters, if no reference is present then article will be his own thread
     * On success return status 340 on firstPhase and 240 on secondPhase
     * On error returns status 440 on firstPhase or 441 on secondPhase
     * https://tools.ietf.org/html/rfc3977#section-6.3.1
     *
     * @returns {Promise<Response>}
     * @param request
     */
    public async postArticle(request: PostType):
        Promise<Response> {
        const actionFirstPhase: IAction = commandActions.postArticleFirstPhase;
        const actionSecondPhase: IAction = commandActions.postArticleSecondPhase;
        this.socket.write(actionFirstPhase.command);
        const response: Response = await this.getResponse(actionFirstPhase.multiline);
        if (response.status !== actionFirstPhase.success) {
            throw new CustomError(response.status);
        }

        const usenetHeaders = (request.reference && request.reference !== 'undefined') ? {
            newsgroups: request.group,
            references: request.reference,
        } : { newsgroups: request.group };
        const buildMessage = () => new Promise((resolve, reject) => {
            const mail = new MailComposer({
                from: `"${request.from}" <${request.email}>`,
                subject: request.subject,
                headers: usenetHeaders,
                text: request.raw,
                html: request.html,
                attachments: [
                    ...request.attachments,
                    ],
            });
            mail.compile().build(async (err: any, message: any) => {
                if (err) reject(err);
                resolve(`${message.toString()}${CRLF}.${CRLF}`);
            });
        });

        const message = await buildMessage();

        this.socket.write(actionSecondPhase.command(message));
        const postResponse: Response = await this.getResponse(actionSecondPhase.multiline).catch(console.error);

        if (postResponse.status === actionSecondPhase.success) {
            return postResponse;
        } else {
            throw new CustomError(response.status);
        }
    }

    /**
     * Returns an array of all available groups in newsgroup
     * On success return status 215
     * On error returns empty array
     * https://tools.ietf.org/html/rfc3977#section-7.6
     *
     * @returns {Promise<string[]>}
     */
    public async listGroups(): Promise<string[]> {
        const action: IAction = commandActions.listGroups;
        this.socket.write(action.command);
        const response: Response = await this.getResponse(action.multiline);
        if (response.status === action.success) {
            return response.getLines().map((group: string) => group.split(' ')[0]);
        } else {
            throw new CustomError(response.status);
        }
    }

    /**
     * Returns the format of articles on server
     * On success returns status 215
     * On error returns empty response
     * https://tools.ietf.org/html/rfc3977#section-8.4
     *
     * @returns {Promise<string[]>}
     */
    public async overview(): Promise<string[]> {
        const action: IAction = commandActions.getOverview;
        this.socket.write(action.command);
        const response: Response = await this.getResponse(action.multiline);
        if (response.status === action.success) {
            return response.getLines();
        } else {
            throw new CustomError(response.status);
        }
    }

    /**
     *  Returns information from the overview database for the specified range of articles
     *  Note that before this command one must select group and have Format of articles using LIST OVERVIEW.FMT
     *  On success returns 224
     *  On error returns 412, 420 or 502
     *  https://tools.ietf.org/html/rfc2980#section-2.8
     *
     * @param {number} from
     * @param {number} to
     * @param {Array<string>} format
     * @returns {Promise<IXoverArticles[]>}
     */
    public async xover(from: number, to: number, format: string[]):
        Promise<IXoverArticles[]> {
        const action: IAction = commandActions.listArticles;
        this.socket.write(action.command(from, to));
        const response: Response = await this.getResponse(action.multiline);
        if (response.status === action.success && format.length > 0) {
            const lines: string[] = response.getLines();
            const articles: IXoverArticles[] = [];
            lines.forEach((article) => {
                const lines = article.split('\t');
                const message: any = {
                    NumberID: parseInt(lines[0], 10),
                };
                format.forEach((item, index) => {
                    const key = item.replace(/[-:]/g, '');
                    message[key] = lines[index + 1];
                });
                articles.push(message);
            });
            return articles;
        } else {
            throw new CustomError(response.status);
        }
    }

    /**
     * Returns the contents of all the fields in database for the specified range of articles
     * This method returns tree representation of articles using MessageTreeNode class
     * On success returns 224
     * On error returns 412 when no group is selected and 423 when there are no articles in given range
     * https://tools.ietf.org/html/rfc3977#section-8.3
     *
     * @return {Promise<MessageTreeNode>}
     * @param from
     * @param to
     */
    public async overRange(from: number | string, to: number | string): Promise<MessageTreeNode> {
        const action: IAction = commandActions.overRange;
        this.socket.write(action.command(from, to));
        const response: Response = await this.getResponse(action.multiline);
        if (response.status === action.success) {
            const lines: string = response.getLines().join('');
            const articleInformationArray = lines.split('\t');
            const rootMessageTreeNode: MessageTreeNode = new MessageTreeNode(
                undefined,
                undefined,
            );
            for (let i = 0, length = articleInformationArray.length; i < length - 1; i += 8) {
                const singleArticle: string[] = articleInformationArray.slice(i, i + 7);
                const messageInfo: IMessageInfo = parseMessageInfo(singleArticle);
                rootMessageTreeNode.insertMessageInfo(messageInfo);
            }
            return rootMessageTreeNode;
        } else {
            throw new CustomError(response.status);
        }
    }

    /**
     * Returns the contents of all the fields in database for the specified range of articles
     * This method returns tree representation of articles using MessageTreeNode class
     * Note that MessageTreeNode is filtered using regular expression
     * On success returns 224
     * On error returns 412 when no group is selected and 423 when there are no articles in given range
     * https://tools.ietf.org/html/rfc3977#section-8.3
     *
     * @return {Promise<INodeCountTree>}
     * @param from
     * @param to
     * @param begin
     * @param end
     * @param pattern
     */
    public async overRangeRegex(
        from: number,
        to: number,
        begin: number,
        end: number,
        pattern: string,
    ): Promise<INodeCountTree> {
        const action: IAction = commandActions.overRange;

        this.socket.write(action.command(from, to));
        const response: Response = await this.getResponse(action.multiline);

        if (response.status === action.success) {
            const lines: string = response.getLines().join('');
            const articleInformationArray = lines.split('\t');
            const rootMessageTreeNode: MessageTreeNode = new MessageTreeNode(
                undefined,
                undefined,
            );
            let validNodeCount = 0;
            for (let i = 0, length = articleInformationArray.length; i < length - 1; i += 8) {
                const singleArticle: string[] = articleInformationArray.slice(i, i + 7);
                const messageInfo: IMessageInfo | any = parseMessageInfo(singleArticle);
                if (
                    (messageInfo.subject && messageInfo.subject.toLowerCase().includes(pattern))
                ) {
                    validNodeCount += 1;
                    if ( validNodeCount > begin && validNodeCount <= end ) {
                        rootMessageTreeNode.insertMessageInfo(messageInfo);
                    }
                }
            }
            return { tree: rootMessageTreeNode, nodeCount: validNodeCount};
        } else {
            throw new CustomError(response.status);
        }
    }

    /**
     * Returns the contents of all the fields in database for the specified range of articles
     * This method returns tree representation of articles using MessageTreeNode class
     * Note that MessageTreeNode is filtered using regular globalID of article
     * On success returns 224
     * On error returns 412 when no group is selected and 423 when there are no articles in given range
     * https://tools.ietf.org/html/rfc3977#section-8.3
     *
     * @return {Promise<MessageTreeNode>}
     * @param from
     * @param to
     * @param pattern
     */
    public async overRangeReference(from: number, to: number, pattern: string): Promise<MessageTreeNode> {
        const action: IAction = commandActions.overRange;
        this.socket.write(action.command(from, to));
        const response: Response = await this.getResponse(action.multiline);
        if (response.status === action.success) {
            const lines: string = response.getLines().join('');
            const articleInformationArray = lines.split('\t');
            const rootMessageTreeNode: MessageTreeNode = new MessageTreeNode(
                undefined,
                undefined,
            );
            for (let i = 0, length = articleInformationArray.length; i < length - 1; i += 8) {
                const singleArticle: string[] = articleInformationArray.slice(i, i + 7);
                const messageInfo: IMessageInfo | any = parseMessageInfo(singleArticle);
                if (
                    (messageInfo.globalID === pattern)
                    ||
                    (messageInfo.reference && messageInfo.reference.includes(pattern))
                ) {
                    rootMessageTreeNode.insertMessageInfo(messageInfo);
                }
            }
            return rootMessageTreeNode;
        } else {
            throw new CustomError(response.status);
        }
    }

    /**
     * Returns an array of message-ids of articles posted or received on the server
     * uses dateTime wildmat and group pattern `server.*`
     * dateTime wildmat in format `YYYYMMDD` for date and `HHMMSS` for time
     * On success returns 230
     * https://tools.ietf.org/html/rfc3977#section-7.4
     *
     * @return {Promise<any>}
     * @param wildmat
     * @param dateTime
     */
    public async newNews(wildmat: string, dateTime: string): Promise<any> {
        const action: IAction = commandActions.listNewArticles;
        this.socket.write(action.command(wildmat, dateTime));
        const response: Response = await this.getResponse(action.multiline);
        if (response.status === action.success) {
            return response.response;
        } else {
            throw new CustomError(response.status);
        }
    }

    /**
     * Returns whether an article exists on sever, boolean value is always returned
     * On success returns 223
     * hhttps://tools.ietf.org/html/rfc3977#section-6.2.4
     *
     * @return {Promise<any>}
     * @param messageID
     */
    public async checkExistence(messageID: string): Promise<boolean> {
        const action: IAction = commandActions.checkArticleExistence;
        this.socket.write(action.command(messageID));
        const response: Response = await this.getResponse(action.multiline);
        if (response.status === action.success) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Returns an array of newsgroups created on the server since the wildmat dateTime
     * wildmat in format `YYYYMMDD` for date and `HHMMSS` for time
     * On success returns 231
     * https://tools.ietf.org/html/rfc3977#section-7.3
     *
     * @return {Promise<any>}
     * @param dateTime
     */
    public async newGroups(dateTime: string): Promise<any> {
        const action: IAction = commandActions.listNewGroups;
        this.socket.write(action.command(dateTime));
        const response: Response = await this.getResponse(action.multiline);
        if (response.status === action.success) {
            return response.response;
        } else {
            throw new CustomError(response.status);
        }
    }

    /**
     * Disconnect from the server
     * On success returns 205
     * https://tools.ietf.org/html/rfc3977#section-5.4
     *
     * @returns {Promise<Response>}
     */
    public async quit(): Promise<Response> {
        const action: IAction = commandActions.quit;
        this.socket.write(action.command);
        const response: Response = await this.getResponse(action.multiline);
        this.socket.end();
        this.isConnected = false;
        return response;
    }

    /**
     * Getting response from server
     *
     * @returns Promise
     */
    private async getResponse(isMultiline: boolean): Promise<any> {
        const connection: net.Socket = this.socket;

        const response: any = await new Promise((resolve, reject) => {

            connection.on('error', (err: any): any => {
                return reject(err);
            });

            let pipeline: any = connection;

            // if isMultiline = true, then pipe two stream together
            if (isMultiline) {
                pipeline = pipeline.pipe(new MultiStreamReader());
            }
            pipeline = pipeline.pipe(new SingleStreamReader(isMultiline));

            // noinspection TsLint
            let response: any = null;

            pipeline.on('error', (err: any): any => {
                return reject(err);
            });

            pipeline.on('data', (data: any): void => {
                response = data;
            });

            pipeline.on('end', (): any => {
                pipeline.unpipe();
                connection.removeAllListeners('data');
                connection.removeAllListeners('error');
                connection.removeAllListeners('end');

                return resolve(response);
            });
        });
        return response;
    }

}
