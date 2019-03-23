import {RESPONSE_CODES} from '../constants/responseCodes';
import CustomError from './errorHandler';

export interface IResponseObject {
    status: number;
    response: string;
    lines: string[];
}

export default class Response {

    public readonly status: number;
    public readonly response: string;
    private readonly lines: string[];

    constructor(incoming: IResponseObject) {
        this.status = incoming.status || 499;
        this.response = incoming.response || '';
        this.lines = incoming.lines || [];
    }

    public static parseResponse(chunk: Buffer): Response {

        const parsedResponse: string[] = chunk.toString().trim().split('\r\n');

        const status: number = parseInt(parsedResponse[0].substr(0, 3), 10);

        if (status < 200 && status > 400) { throw new CustomError(status); }

        let response;
        if (status === 211 || status === 222) {
            response = parsedResponse[0].substr(3).trim();
        } else {
            response = RESPONSE_CODES[status];
        }

        let lines: string[];
        parsedResponse.length > 1 ? lines = parsedResponse.slice(1) : lines = [];

        return new Response({status, response, lines});
    }

    public getLines(): string[] {
        // Note that every lines has `dot` at the end, we remove it here
        return this.lines.slice(0, -1);
    }

    public getStatus(): number {
        return this.status;
    }

    public getResponse(): string {
        return this.response;
    }

}
