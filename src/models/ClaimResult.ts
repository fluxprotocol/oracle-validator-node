export enum ClaimError {
    AlreadyClaimed = 'AlreadyClaimed',
    Unknown = 'Unknown',
}

export enum ClaimResultType {
    Error = 'error',
    Success = 'success',
}

export interface SuccessfulClaimResult {
    received: string;
    type: ClaimResultType.Success;
}

export interface UnsuccessfulClaimResult {
    error: ClaimError;
    type: ClaimResultType.Error;
}

export type ClaimResult = SuccessfulClaimResult | UnsuccessfulClaimResult;

export function isClaimResultSuccesful(result: ClaimResult): result is SuccessfulClaimResult {
    return result.type === ClaimResultType.Success;
}
