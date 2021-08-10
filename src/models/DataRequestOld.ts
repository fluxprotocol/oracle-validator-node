// import { executeJob } from "../core/JobExecuter";
// import NodeBalance from "../core/NodeBalance";
// import { stakeOnDataRequest } from "../core/Oracle";
// import ProviderRegistry from "../providers/ProviderRegistry";
// import logger from "../services/LoggerService";
// import { isClaimResultSuccesful } from "./ClaimResult";
// import { DataRequestDataType } from "./DataRequestDataType";
// import { getRequestOutcome, isOutcomesEqual, Outcome } from './DataRequestOutcome';
// import { ExecuteResult } from "./JobExecuteResult";
// import { ResolutionWindow } from "./ResolutionWindow";
// import { isStakeResultSuccesful, StakeError, StakeResult, StakeResultType, SuccessfulStakeResult } from "./StakingResult";

// export const DATA_REQUEST_TYPE = 'DataRequest';

// export interface RequestInfo {
//     end_point: string;
//     source_path: string;
// }

// export interface DataRequestProps {
//     id: string;
//     sources: RequestInfo[];
//     contractId: string;
//     tokenContractId: string;
//     finalArbitratorTriggered: boolean;
//     finalizedOutcome?: Outcome;
//     outcomes: string[];
//     resolutionWindows: ResolutionWindow[];
//     providerId: string;
//     executeResult?: ExecuteResult;
//     staking: SuccessfulStakeResult[];
//     claimedAmount?: string;
//     settlementTime: string | number;
//     dataType: DataRequestDataType;
// }

// export default class DataRequest {
//     id: string;
//     internalId: string;
//     providerId: string;
//     contractId: string;
//     tokenContractId: string;
//     outcomes: string[];
//     sources: RequestInfo[];
//     settlementTime: Date;
//     resolutionWindows: ResolutionWindow[];
//     finalArbitratorTriggered: boolean;
//     executeResult?: ExecuteResult;
//     staking: SuccessfulStakeResult[] = [];
//     finalizedOutcome?: Outcome;
//     claimedAmount?: string;
//     dataType: DataRequestDataType;
//     type: string = DATA_REQUEST_TYPE;

//     constructor(props: DataRequestProps) {
//         this.id = props.id;
//         this.internalId = `${props.id}_${props.providerId}_${props.contractId}`;
//         this.providerId = props.providerId;
//         this.contractId = props.contractId;
//         this.outcomes = props.outcomes ?? [];
//         this.sources = props.sources;
//         this.resolutionWindows = [];
//         this.executeResult = props.executeResult;
//         this.staking = props.staking ?? [];
//         this.claimedAmount = props.claimedAmount ?? undefined;
//         this.finalArbitratorTriggered = props.finalArbitratorTriggered ?? false;
//         this.finalizedOutcome = props.finalizedOutcome ?? undefined;
//         this.settlementTime = new Date(props.settlementTime);
//         this.tokenContractId = props.tokenContractId;
//         this.dataType = props.dataType;

//         if (props.resolutionWindows.length) {
//             this.resolutionWindows = props.resolutionWindows.map((rw) => ({
//                 ...rw,
//                 endTime: new Date(rw.endTime),
//             }));
//         }
//     }

//     get currentWindow(): ResolutionWindow | undefined {
//         return this.resolutionWindows[this.resolutionWindows.length - 1];
//     }

//     hasStakenOnRound(roundId: number): boolean {
//         return this.staking.some(s => s.roundId === roundId);
//     }

//     update(request: DataRequest) {
//         this.resolutionWindows = request.resolutionWindows;
//         this.finalizedOutcome = request.finalizedOutcome;
//         this.finalArbitratorTriggered = request.finalArbitratorTriggered;
//         logger.debug(`${this.internalId} - Updating status fo: ${JSON.stringify(this.finalizedOutcome)}, rw: ${this.resolutionWindows.length}, fat: ${this.finalArbitratorTriggered}`);
//     }

//     /**
//      * Checks whether or not the data request can be executed & staked on
//      * We cannot pre run a API call. This would cause the node to stake on wrong data
//      *
//      * @return {boolean}
//      * @memberof DataRequest
//      */
//     isExecutable(): boolean {
//         const now = new Date();

//         if (now.getTime() >= this.settlementTime.getTime()) {
//             return true;
//         }

//         return false;
//     }

//     /**
//      * Checks whether this request can be safely removen from the database
//      * Either we did not stake (or already claimed), but the request got finalized or the final arbitrator got triggered
//      * Either way it's safe to remove this from our watch pool and let the user manually claim the earnings
//      *
//      * @return {boolean}
//      * @memberof DataRequest
//      */
//     isDeletable(): boolean {
//         if (this.claimedAmount) {
//             return true;
//         }

//         if (this.finalArbitratorTriggered) {
//             return true;
//         }

//         if (this.finalizedOutcome && !this.isClaimable()) {
//             return true;
//         }

//         return false;
//     }

//     isClaimable(): boolean {
//         if (!this.currentWindow) {
//             return false;
//         }

//         // When we have nothing to stake we can not claim
//         if (this.staking.length === 0) {
//             return false;
//         }

//         if (this.claimedAmount) {
//             return false;
//         }

//         // Window 0 must be bonded
//         // This makes some things fail...
//         if (this.resolutionWindows.length < 2) {
//             return false;
//         }

//         const now = new Date();

//         if (now.getTime() >= new Date(this.currentWindow.endTime).getTime()) {
//             return true;
//         }

//         return false;
//     }

//     async execute() {
//         if (!this.isExecutable()) {
//             logger.debug(`${this.internalId} - Execute was called but it cannot be executed yet`);
//             return;
//         }

//         logger.debug(`${this.internalId} - Executing`);
//         const results = await executeJob(this);
//         logger.debug(`${this.internalId} - Executed, results: ${JSON.stringify(results)}`);

//         this.executeResult = results;
//     }

//     async claim(providerRegistry: ProviderRegistry): Promise<boolean> {
//         try {
//             if (!this.finalizedOutcome) {
//                 logger.debug(`${this.internalId} - Finalizing`);
//                 await providerRegistry.finalize(this.providerId, this);
//                 logger.debug(`${this.internalId} - Finalized`);
//             }

//             logger.debug(`${this.internalId} - Claiming`);
//             const claimResult = await providerRegistry.claim(this.providerId, this);
//             logger.debug(`${this.internalId} - Claim, results: ${JSON.stringify(claimResult)}`);

//             if (!isClaimResultSuccesful(claimResult)) {
//                 return false;
//             }

//             this.claimedAmount = claimResult.received;
//             return true;
//         } catch(error) {
//             return false;
//         }
//     }

//     async stake(
//         providerRegistry: ProviderRegistry,
//         nodeBalance: NodeBalance,
//     ): Promise<StakeResult> {
//         const currentWindowRound = this.currentWindow?.round ?? 0;

//         if (this.hasStakenOnRound(currentWindowRound)) {
//             logger.debug(`${this.internalId} - Already staken`);
//             return {
//                 type: StakeResultType.Error,
//                 error: StakeError.AlreadyStaked,
//             };
//         }

//         if (this.finalizedOutcome) {
//             logger.debug(`${this.internalId} - Already finalized, can't stake`);
//             return {
//                 type: StakeResultType.Error,
//                 error: StakeError.AlreadyBonded,
//             };
//         }

//         if (!this.executeResult) {
//             return {
//                 type: StakeResultType.Error,
//                 error: StakeError.RequestNotFound,
//             };
//         }

//         // We can't stake on a round where the previous round had the same answer
//         const previousWindow = this.resolutionWindows[currentWindowRound - 1];

//         if (previousWindow && previousWindow.bondedOutcome) {
//             if (isOutcomesEqual(previousWindow.bondedOutcome, getRequestOutcome(this))) {
//                 logger.debug(`${this.internalId} - Previous bonded outcome is the same as our outcome, can't stake`);
//                 return {
//                     type: StakeResultType.Error,
//                     error: StakeError.AlreadyBonded,
//                 }
//             }
//         }

//         logger.debug(`${this.internalId} - Staking`);

//         const stakeResult = await stakeOnDataRequest(
//             providerRegistry,
//             nodeBalance,
//             this,
//         );

//         logger.debug(`${this.internalId} - Stake complete: ${JSON.stringify(stakeResult)}`);

//         if (isStakeResultSuccesful(stakeResult)) {
//             this.staking.push(stakeResult);
//         } else {
//             if (stakeResult.error !== StakeError.AlreadyBonded) {
//                 logger.debug(`${this.internalId} - Unsuccesful staking on round ${this.currentWindow?.round} for: ${this.toString()}`);
//             }
//         }

//         return stakeResult;
//     }

//     toString() {
//         return JSON.stringify({
//             ...this,
//         });
//     }
// }


// export function createMockRequest(request: Partial<DataRequestProps> = {}): DataRequest {
//     return new DataRequest({
//         contractId: 'test.near',
//         tokenContractId: 'token.near',
//         id: '1',
//         outcomes: [],
//         resolutionWindows: [
//             {
//                 endTime: new Date(),
//                 round: 0,
//                 bondSize: '2',
//             }
//         ],
//         sources: [],
//         providerId: 'near',
//         executeResult: undefined,
//         staking: [],
//         claimedAmount: undefined,
//         finalArbitratorTriggered: false,
//         finalizedOutcome: undefined,
//         settlementTime: 1,
//         dataType: { type: 'string' },
//         ...request,
//     });
// }
