export enum JobExecuteError {
    ResponseNotJson,
    ResponseNotOk,
    Unknown,
}

export enum JobResultType {
    Error = 'error',
    Success = 'success',
}

export interface SuccessfulJobResult<T> {
    status: number;
    data: T;
    type: JobResultType.Success;
}

export interface UnsuccessfulJobResult {
    status: number;
    error: JobExecuteError;
    type: JobResultType.Error;
}


export type JobExecuteResult<T> = SuccessfulJobResult<T> | UnsuccessfulJobResult;

export function isJobSuccesful<T>(result: JobExecuteResult<T>): result is SuccessfulJobResult<T> {
    return result.type === JobResultType.Success;
}
