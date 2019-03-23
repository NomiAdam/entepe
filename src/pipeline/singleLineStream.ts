import { Transform } from 'stream';
import Response from '../utils/response';

/**
 *
 * @class SingleStreamReader
 * @extends {Transform}
 */
export class SingleStreamReader extends Transform {

    private readonly chunks: Buffer[];
    private readonly multiline: boolean;
    private response: Response | undefined;

    constructor(multiline: boolean) {
        super({ objectMode: true });
        this.chunks = [];
        this.response = undefined;
        this.multiline = multiline || false;
    }

    public _transform(chunk: any, encoding: string, callback: any): void {
        if (!this.multiline) {
            if ('\r\n' === chunk.toString().substr(-2)) {
                this.response = Response.parseResponse(chunk);
                this.end();
            }
        } else {
            if (chunk instanceof Response) {
                this.push(chunk);
                this.push(null);
                return;
            }
            this.chunks.push(chunk);
        }
        callback();
    }

    public _flush(callback: any): void {
        !this.multiline ? this.push(this.response) : this.push(Response.parseResponse(Buffer.concat(this.chunks)));
        callback();
    }

}
