import { ResponseType } from '../types';

// https://tools.ietf.org/html/rfc3977
const RESPONSE_CODES: ResponseType = {
    200: 'Service available, posting allowed', // RFC 3977, single-line
    201: 'Service available, posting prohibited', // RFC 3977, single-line
    211: 'Group selected/Article numbers follow', // RFC 3977, single-line/multi-line
    215: 'Information follows', // RFC 3977, multi-line
    220: 'Article follows', // RFC 3977, multi-line
    221: 'Article headers follow', // RFC 3977, multi-line
    222: 'Article body follows', // RFC 3977, multi-line
    223: 'Article exists and selected', // RFC 3977, single-line
    224: 'Overview information follows', // RFC 3977, multi-line
    225: 'Headers follow', // RFC 3977, multi-line
    230: 'List of new articles follows', // RFC 3977, multi-line
    231: 'List of new newsgroups follows', // RFC 3977, multi-line
    240: 'Article received OK', // RFC 3977, single-line
    340: 'Send article to be posted', // RFC 3977 single-line
};

const ERROR_CODES: ResponseType = {
    400: 'Service not available or no longer available', // RFC 3977
    401: 'The server is in the wrong mode', // RFC 3977
    403: 'Internal fault or problem preventing action being taken', // RFC 3977
    411: 'No such newsgroup',   // RFC 3977
    412: 'No newsgroup selected',  // RFC 3977
    420: 'Current article number is invalid',  // RFC 3977
    421: 'No next article in this group',  // RFC 3977
    422: 'No previous article in this group',  // RFC 3977
    423: 'No article with that number or in that range',  // RFC 3977
    430: 'No article with given messageID',  // RFC 3997
    440: 'Posting not permitted', // RFC 3977
    441: 'Posting failed',  // RFC 3977
    480: 'Command unavailable until the client has authenticated itself', // RFC 3977
    481: 'Authentication failed/rejected', // RFC 4643
    483: 'Command unavailable until suitable privacy has been arranged', // RFC 3977
    500: 'Unknown command', // RFC 3977
    501: 'Syntax error', // RFC 3977
    502: 'Command not permitted', // Every command is disabled, RFC 3977
    503: 'Feature not supported', // RFC 3977
    504: 'Invalid base64-encoded argument', // RFC 3977
};

export {RESPONSE_CODES, ERROR_CODES};
