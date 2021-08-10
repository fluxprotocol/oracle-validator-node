// import { createMockRequest } from "../test/mocks/DataRequest";
// import { parseNodeOptions } from "../models/NodeOptions";
// import { createMockNodeBalance } from "../test/mocks/NodeBalance";
// import { createMockProviderRegistry } from "../test/mocks/ProviderRegistry";
// import * as DataRequestService from '../services/DataRequestService';
// import JobWalker from "./JobWalker";
// import { StakeResult, StakeResultType } from "../models/StakingResult";
// import { ExecuteResultType } from "../models/JobExecuteResult";
// import { OutcomeType } from "../models/DataRequestOutcome";

// describe('JobWalker', () => {
//     let storeDataRequestSpy: jest.SpyInstance<Promise<void>>;
//     let deleteDataRequestSpy: jest.SpyInstance<Promise<void>>;

//     beforeEach(() => {
//         storeDataRequestSpy = jest.spyOn(DataRequestService, 'storeDataRequest');
//         storeDataRequestSpy.mockResolvedValue();

//         deleteDataRequestSpy = jest.spyOn(DataRequestService, 'deleteDataRequest');
//         deleteDataRequestSpy.mockResolvedValue();
//     });

//     afterEach(() => {
//         storeDataRequestSpy.mockRestore();
//         deleteDataRequestSpy.mockRestore();
//     });

//     describe('constructor', () => {
//         it('should only have requests that are not claimed yet', () => {
//             const jobWalker = new JobWalker(
//                 createMockProviderRegistry([]),
//                 [
//                     createMockRequest({
//                         id: '1'
//                     }),
//                     createMockRequest({
//                         id: '2'
//                     }),
//                     createMockRequest({
//                         id: '3',
//                         claimedAmount: '1',
//                     }),
//                 ]
//             );

//             expect(jobWalker.requests.size).toBe(2);
//         });

//         it('should add requests that have been finalized and staked on but not claimed', () => {
//             const jobWalker = new JobWalker(
//                 createMockProviderRegistry([]),
//                 [
//                     createMockRequest({
//                         id: '1',
//                         resolutionWindows: [{
//                             round: 0,
//                             bondSize: '1',
//                             endTime: new Date(),
//                         }, {
//                             round: 1,
//                             bondSize: '1',
//                             endTime: new Date(),
//                         }],
//                         staking: [{
//                             roundId: 0,
//                             type: StakeResultType.Success,
//                         }],
//                         finalizedOutcome: {
//                             type: OutcomeType.Invalid,
//                         }
//                     }),
//                     createMockRequest({
//                         id: '2',
//                         resolutionWindows: [{
//                             round: 0,
//                             bondSize: '1',
//                             endTime: new Date(),
//                         }, {
//                             round: 1,
//                             bondSize: '1',
//                             endTime: new Date(),
//                         }],
//                         staking: [{
//                             roundId: 0,
//                             type: StakeResultType.Success,
//                         }],
//                         finalizedOutcome: {
//                             answer: 'Tralala',
//                             type: OutcomeType.Answer,
//                         }
//                     }),
//                     createMockRequest({
//                         id: '3',
//                         resolutionWindows: [{
//                             round: 0,
//                             bondSize: '1',
//                             endTime: new Date(),
//                         }, {
//                             round: 1,
//                             bondSize: '1',
//                             endTime: new Date(),
//                         }],
//                         staking: [],
//                         finalizedOutcome: {
//                             type: OutcomeType.Invalid,
//                         }
//                     }),
//                 ]
//             );

//             expect(jobWalker.requests.size).toBe(2);
//         });
//     });

//     describe('addNewDataRequest', () => {
//         it('should add a new request and push it to the job walker', async () => {
//             const jobWalker = new JobWalker(
//                 createMockProviderRegistry([]),
//                 createMockNodeBalance(),
//                 []
//             );

//             const request = createMockRequest({});

//             request.execute = jest.fn();
//             request.stake = jest.fn(() => {
//                 return Promise.resolve({
//                     amountStaked: '1',
//                     roundId: 0,
//                     type: StakeResultType.Success,
//                 } as StakeResult);
//             });

//             storeDataRequestSpy.mockResolvedValue();

//             expect(jobWalker.requests.size).toBe(0);

//             await jobWalker.addNewDataRequest(request);

//             expect(request.execute).toBeCalledTimes(1);
//             expect(request.stake).toBeCalledTimes(1);
//             expect(storeDataRequestSpy).toHaveBeenCalledTimes(1);
//             expect(jobWalker.requests.size).toBe(1);
//         });
//     });

//     describe('walkAllRequests', () => {
//         it('should process requests that are not already processing', async () => {
//             const request = createMockRequest({});
//             const request2 = createMockRequest({
//                 id: '2',
//             });
//             const jobWalker = new JobWalker(
//                 createMockProviderRegistry([]),
//                 createMockNodeBalance(),
//                 [request, request2]
//             );

//             const walkRequestMock = jest.fn();
//             jobWalker.processingIds.add(request2.internalId);
//             jobWalker.walkRequest = walkRequestMock;
//             await jobWalker.walkAllRequests();

//             expect(walkRequestMock).toHaveBeenCalledTimes(1);
//             expect(walkRequestMock).toHaveBeenCalledWith(request);
//             expect(jobWalker.processingIds).toStrictEqual(new Set([request2.internalId]));
//         });
//     });

//     describe('walkRequest', () => {
//         it('should claim when the request is claimable', async () => {
//             const request = createMockRequest({
//                 staking: [{
//                     amountStaked: '1',
//                     roundId: 0,
//                     type: StakeResultType.Success,
//                 }],
//             });

//             const mockExecute = jest.fn();
//             const mockClaim = jest.fn().mockResolvedValue(true);
//             const mockStakeOrChallenge = jest.fn();

//             request.execute = mockExecute;
//             request.claim = mockClaim;
//             request.stake = mockStakeOrChallenge;
//             request.isClaimable = jest.fn(() => true);

//             const providerRegistry = createMockProviderRegistry([]);
//             const jobWalker = new JobWalker(
//                 providerRegistry,
//                 createMockNodeBalance(),
//                 [request]
//             );

//             expect(jobWalker.requests.size).toBe(1);

//             providerRegistry.getDataRequestById.mockResolvedValue(request);
//             await jobWalker.walkRequest(request);

//             expect(mockExecute).toHaveBeenCalledTimes(0);
//             expect(mockClaim).toHaveBeenCalledTimes(1);
//             expect(mockStakeOrChallenge).toHaveBeenCalledTimes(0);
//             expect(jobWalker.requests.size).toBe(0);
//             expect(storeDataRequestSpy).toHaveBeenCalledTimes(0);
//             expect(deleteDataRequestSpy).toHaveBeenCalledTimes(1);
//         });

//         it('should re-stake if there is an execute result but no staking', async () => {
//             const request = createMockRequest({
//                 executeResult: {
//                     data: 'answer',
//                     status: 200,
//                     type: ExecuteResultType.Success,
//                 }
//             });

//             const mockExecute = jest.fn();
//             const mockClaim = jest.fn().mockResolvedValue(false);
//             const mockStakeOrChallenge = jest.fn();

//             request.execute = mockExecute;
//             request.claim = mockClaim;
//             request.stake = mockStakeOrChallenge;
//             request.isClaimable = jest.fn(() => false);

//             const providerRegistry = createMockProviderRegistry([]);
//             const jobWalker = new JobWalker(
//                 providerRegistry,
//                 createMockNodeBalance(),
//                 [request]
//             );

//             expect(jobWalker.requests.size).toBe(1);

//             providerRegistry.getDataRequestById.mockResolvedValue(request);
//             await jobWalker.walkRequest(request);

//             expect(mockExecute).toHaveBeenCalledTimes(0);
//             expect(mockClaim).toHaveBeenCalledTimes(0);
//             expect(mockStakeOrChallenge).toHaveBeenCalledTimes(1);
//             expect(jobWalker.requests.size).toBe(1);
//             expect(storeDataRequestSpy).toHaveBeenCalledTimes(1);
//         });

//         it('should execute and stake when there is no staking and no execute results', async () => {
//             const request = createMockRequest({});

//             const mockExecute = jest.fn(async () => {
//                 request.executeResult = {
//                     type: ExecuteResultType.Success,
//                     status: 0,
//                     data: 'good',
//                 };
//             });
//             const mockClaim = jest.fn().mockResolvedValue(false);
//             const mockStake = jest.fn();
//             const mockUpdate = jest.fn();

//             request.execute = mockExecute;
//             request.update = mockUpdate;
//             request.claim = mockClaim;
//             request.stake = mockStake;
//             request.isClaimable = jest.fn(() => false);

//             const providerRegistry = createMockProviderRegistry([]);
//             const jobWalker = new JobWalker(
//                 providerRegistry,
//                 createMockNodeBalance(),
//                 [request]
//             );

//             expect(jobWalker.requests.size).toBe(1);

//             providerRegistry.getDataRequestById.mockResolvedValue(createMockRequest());
//             await jobWalker.walkRequest(request);

//             expect(mockUpdate).toHaveBeenCalledTimes(1);
//             expect(mockExecute).toHaveBeenCalledTimes(1);
//             expect(mockClaim).toHaveBeenCalledTimes(0);
//             expect(mockStake).toHaveBeenCalledTimes(1);
//             expect(jobWalker.requests.size).toBe(1);
//             expect(storeDataRequestSpy).toHaveBeenCalledTimes(1);
//         });

//         it('should delete the request when it\'s deletable', async () => {
//             const request = createMockRequest({});
//             const mockExecute = jest.fn();
//             const mockClaim = jest.fn().mockResolvedValue(false);
//             const mockStake = jest.fn();
//             const mockUpdate = jest.fn();

//             request.execute = mockExecute;
//             request.update = mockUpdate;
//             request.claim = mockClaim;
//             request.stake = mockStake;

//             const providerRegistry = createMockProviderRegistry([]);
//             const jobWalker = new JobWalker(
//                 providerRegistry,
//                 createMockNodeBalance(),
//                 [request]
//             );

//             request.isDeletable = jest.fn(() => true);
//             expect(jobWalker.requests.size).toBe(1);

//             providerRegistry.getDataRequestById.mockResolvedValue(createMockRequest());
//             await jobWalker.walkRequest(request);

//             expect(mockUpdate).toHaveBeenCalledTimes(1);
//             expect(mockExecute).toHaveBeenCalledTimes(0);
//             expect(mockClaim).toHaveBeenCalledTimes(0);
//             expect(mockStake).toHaveBeenCalledTimes(0);
//             expect(jobWalker.requests.size).toBe(0);
//             expect(deleteDataRequestSpy).toHaveBeenCalledTimes(1);
//         });
//     });
// });
