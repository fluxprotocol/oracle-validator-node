export enum ExecuteResultType {
    Error = 'error',
    Success = 'success',
}

export interface SuccessfulExecuteResult {
    status: number;
    data: string;
    type: ExecuteResultType.Success;
}

export interface UnsuccessfulExecuteResult {
    status: number;
    error: string;
    type: ExecuteResultType.Error;
}


export type ExecuteResult = SuccessfulExecuteResult | UnsuccessfulExecuteResult;

export function isExecuteResultSuccesful(result: ExecuteResult): result is SuccessfulExecuteResult {
    return result.type === ExecuteResultType.Success;
}
