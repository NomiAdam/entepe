import {ERROR_CODES} from '../constants/responseCodes';

export default class ResponseError extends Error {

    public status: number;
    public response: string;

    constructor(status: number, ...params: string[]) {
        super(...params);
        this.status = status;
        this.response = ERROR_CODES[status] || 'Wrong error code';
    }
}
