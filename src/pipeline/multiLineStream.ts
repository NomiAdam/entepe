import { Transform } from 'stream';
import Response from '../utils/response';

/**
 *
 * @class StreamReader
 * @extends {Transform} - Duplex Stream
 */
export class MultiStreamReader extends Transform {

    private readonly chunks: Buffer[];
    private response: Response | undefined;

    constructor() {
        super({ objectMode: true });
        this.chunks = [];
        this.response = undefined;
    }

    public _transform(chunk: Buffer, encoding: string, callback: any): void {
        this.chunks.push(chunk);

        if (!(this.response instanceof Response)) {
            this.response = Response.parseResponse(chunk);
            if (this.response.status > 299) {
                this.push(this.response);
                this.push(null);
                return;
            }
        }

        if ('.\r\n' === (Buffer.concat(this.chunks).toString()).substr(-3)) {
            this.push(Response.parseResponse(Buffer.concat(this.chunks)));
            this.push(null);
            return;
        }

        callback();
    }
}
