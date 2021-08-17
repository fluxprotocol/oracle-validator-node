import { Code, Context, executeCode } from '@fluxprotocol/oracle-vm';
import DataRequest from '@fluxprotocol/oracle-provider-core/dist/DataRequest';
import { ExecuteResult, ExecuteResultType } from '../models/JobExecuteResult';

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

export async function executeFetchStringJob(request: DataRequest): Promise<ExecuteResult> {
    const sourceData = request.sources[0];
    const args: string[] = [sourceData.end_point, sourceData.source_path];
    const context = new Context(args);
    context.gasLimit = 1_000_000;

    const executeResult = await executeCode(fetchStringJob, { context });

    if (executeResult.code > 0) {
        return {
            status: executeResult.code,
            error: executeResult.message,
            type: ExecuteResultType.Error,
        }
    }

    return {
        type: ExecuteResultType.Success,
        data: executeResult.result ?? '',
        status: executeResult.code,
    }
}

export default fetchStringJob;
