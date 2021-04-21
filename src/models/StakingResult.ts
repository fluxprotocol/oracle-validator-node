export enum StakeError {
    NotEnoughBalance = 'NotEnoughBalance',
    Unknown = 'Unknown',
    RequestNotFound = 'RequestNotFound',
    AlreadyBonded = 'AlreadyBonded',
    AlreadyStaked = 'AlreadyStaked',
}

export enum StakeResultType {
    Error = 'error',
    Success = 'success',
}

export interface SuccessfulStakeResult {
    amountStaked: string;
    roundId: number;
    type: StakeResultType.Success;
}

export interface UnsuccessfulStakeResult {
    error: StakeError;
    type: StakeResultType.Error;
}

export type StakeResult = SuccessfulStakeResult | UnsuccessfulStakeResult;

export function isStakeResultSuccesful(result: StakeResult): result is SuccessfulStakeResult {
    return result.type === StakeResultType.Success;
}
