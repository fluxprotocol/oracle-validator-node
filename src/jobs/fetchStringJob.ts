import { Code } from '@fluxprotocol/oracle-vm';

const fetchStringJob: Code = [
    // Parsing args
    ['ENV', '$args', 'args'],
    ['PARSE', '$url', '$args', '0', 'string'],
    ['PARSE', '$sourcePath', '$args', '1', 'string'],

    // Fetching the API
    ['FETCH', '$fetchResult', '$url'],

    // Parsing result of API
    ['PARSE', '$answer', '$fetchResult', '$sourcePath', 'string'],
    ['VAR', '$answer', '$answer', 'string'],
    ['RETURN', '$answer'],
];

export default fetchStringJob;
