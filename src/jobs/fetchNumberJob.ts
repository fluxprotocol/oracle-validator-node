import { Code } from '@fluxprotocol/oracle-vm';

const fetchNumberJob: Code = [
    // Parsing args
    ['ENV', '$args', 'args'],
    ['PARSE', '$url', '$args', '0', 'string'],
    ['PARSE', '$sourcePath', '$args', '1', 'string'],
    ['PARSE', '$multiplier', '$args', '2', 'u128'],

    // Fetching the API
    ['FETCH', '$fetchResult', '$url'],

    // Parsing result of API
    ['PARSE', '$number', '$fetchResult', '$sourcePath', 'double'],

    // Preparing for Negative/Positive checks
    ['VAR', '$zero', '0', 'u128'],
    ['VAR', '$negOne', '-1', 'i8'],

    ['LT', '$isNegative', '$number', '$zero'],
    ['GT', '$isPositive', '$number', '$zero'],

    // These will need to be changed each time you add an opcode
    ['VAR', '$POS_JUMP', '16', 'u8'],
    ['VAR', '$END_JUMP', '18', 'u8'],

    ['JUMPI', '$POS_JUMP', '$isPositive'],

    // Make negative number positive again
    ['MUL', '$number', '$number', '$negOne', 'double'],
    ['MUL', '$numberAnswer', '$number', '$multiplier', 'u256'],
    ['JUMP', '$END_JUMP'],

    // Number was already positive, we can skip conversion
    ['JUMPDEST'],
    ['MUL', '$numberAnswer', '$number', '$multiplier', 'u256'],

    // Continue execution
    ['JUMPDEST'],
    ['VAR', '$answer', '{ "negative": $isNegative, "value": "$numberAnswer", "multiplier": "$multiplier" }', 'string'],
    ['RETURN', '$answer'],
];

export default fetchNumberJob;
