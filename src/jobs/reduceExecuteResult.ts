import { ExecuteResult, ExecuteResultType } from "../models/JobExecuteResult";

const INVALID_KEY = 'Invalid';
const ANSWER_PREFIX = 'ans_';

export default function reduceExecuteResult(executeResults: ExecuteResult[]): ExecuteResult {
    // answer => amount same
    const results = new Map<string, number>();

    executeResults.forEach((result) => {
        if (result.type === ExecuteResultType.Error) {
            const amountOfInvalid = results.get(INVALID_KEY);

            results.set(INVALID_KEY, typeof amountOfInvalid !== 'undefined' ? amountOfInvalid + 1 : 1);
        } else {
            const amountOfAnswer = results.get(`${ANSWER_PREFIX}${result.data}`);

            // Prefix so answers cannot have a fake "Invalid" answer
            results.set(`${ANSWER_PREFIX}${result.data}`, typeof amountOfAnswer !== 'undefined' ? amountOfAnswer + 1 : 1);
        }
    });

    // All the answers are different, pretty much a failed API
    if (results.size === executeResults.length) {
        return {
            type: ExecuteResultType.Error,
            error: 'ERR_INVALID_REQUEST',
            status: 500,
        }
    }

    // All answers are the same
    if (results.size === 1) {
        const answer: string = results.keys().next().value;

        if (answer === INVALID_KEY) {
            return {
                type: ExecuteResultType.Error,
                error: 'ERR_INVALID_REQUEST',
                status: 500,
            }
        }

        return {
            type: ExecuteResultType.Success,
            data: answer.substr(ANSWER_PREFIX.length),
            status: 200,
        }
    }

    // We skip invalid answers because they could just be servers that are temp unavailable.
    // If the request is invalid it should already be catched due all the answers be Invalid.
    results.delete(INVALID_KEY);

    // There are multiple valid answers, which indicate the API is non determenistic
    // All validator nodes should mark this as an invalid API request
    if (results.size !== 1) {
        return {
            type: ExecuteResultType.Error,
            error: 'ERR_NON_DETERMENISTIC_ANSWER',
            status: 500,
        }
    }

    // There is only 1 answer left and it's not Invalid
    // We assume this is the correct one
    const answer: string = results.keys().next().value;

    return {
        type: ExecuteResultType.Success,
        data: answer.substr(ANSWER_PREFIX.length),
        status: 200,
    };
}
