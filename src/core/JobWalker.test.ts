// import { createMockRequest } from "../models/DataRequest";
// import { parseNodeOptions } from "../models/NodeOptions";
// import { createMockNodeBalance } from "../test/mocks/NodeBalance";
// import { createMockProviderRegistry } from "../test/mocks/ProviderRegistry";
// import * as DataRequestService from '../services/DataRequestService';
// import JobWalker from "./JobWalker";
// import { StakeResultType } from "../models/StakingResult";
// import { JobResultType } from "../models/JobExecuteResult";

// describe('JobWalker', () => {
//     let storeDataRequestSpy: jest.SpyInstance<Promise<void>>;

//     beforeEach(() => {
//         storeDataRequestSpy = jest.spyOn(DataRequestService, 'storeDataRequest');
//         storeDataRequestSpy.mockResolvedValue();
//     });

//     afterEach(() => {
//         storeDataRequestSpy.mockRestore();
//     });

//     describe('constructor', () => {
//         it('should only have requests that are not claimed yet', () => {
//             const jobWalker = new JobWalker(
//                 parseNodeOptions({}),
//                 createMockProviderRegistry([]),
//                 createMockNodeBalance(),
//                 [
//                     createMockRequest({}),
//                     createMockRequest({}),
//                     createMockRequest({
//                         claimedAmount: '1',
//                     }),
//                 ]
//             );

//             expect(jobWalker.requests.length).toBe(2);
//         });
//     });

//     describe('addNewDataRequest', () => {
//         it('should add a new request and push it to the job walker', async () => {
//             const jobWalker = new JobWalker(
//                 parseNodeOptions({}),
//                 createMockProviderRegistry([]),
//                 createMockNodeBalance(),
//                 []
//             );

//             const request = createMockRequest({});

//             request.execute = jest.fn();
//             request.stakeOrChallenge = jest.fn();

//             storeDataRequestSpy.mockResolvedValue();

//             expect(jobWalker.requests.length).toBe(0);

//             await jobWalker.addNewDataRequest(request);

//             expect(request.execute).toBeCalledTimes(1);
//             expect(request.stakeOrChallenge).toBeCalledTimes(1);
//             expect(storeDataRequestSpy).toHaveBeenCalledTimes(1);
//             expect(jobWalker.requests.length).toBe(1);
//         });
//     });

//     describe('walkAllRequests', () => {
//         it('should process requests that are not already processing', async () => {
//             const request = createMockRequest({});
//             const request2 = createMockRequest({
//                 id: '2',
//             });
//             const jobWalker = new JobWalker(
//                 parseNodeOptions({}),
//                 createMockProviderRegistry([]),
//                 createMockNodeBalance(),
//                 [request, request2]
//             );

//             const walkRequestMock = jest.fn();
//             jobWalker.processingIds = [request2.internalId];
//             jobWalker.walkRequest = walkRequestMock;
//             await jobWalker.walkAllRequests();

//             expect(walkRequestMock).toHaveBeenCalledTimes(1);
//             expect(walkRequestMock).toHaveBeenCalledWith(request);
//             expect(jobWalker.processingIds).toStrictEqual([request2.internalId]);
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
//             request.stakeOrChallenge = mockStakeOrChallenge;
//             request.isClaimable = jest.fn(() => true);

//             const providerRegistry = createMockProviderRegistry([]);
//             const jobWalker = new JobWalker(
//                 parseNodeOptions({}),
//                 providerRegistry,
//                 createMockNodeBalance(),
//                 [request]
//             );

//             expect(jobWalker.requests.length).toBe(1);

//             providerRegistry.getDataRequestById.mockResolvedValue(request);
//             await jobWalker.walkRequest(request);

//             expect(mockExecute).toHaveBeenCalledTimes(0);
//             expect(mockClaim).toHaveBeenCalledTimes(1);
//             expect(mockStakeOrChallenge).toHaveBeenCalledTimes(0);
//             expect(jobWalker.requests.length).toBe(0);
//             expect(storeDataRequestSpy).toHaveBeenCalledTimes(1);
//         });

//         it('should re-stake if there is an execute result but no staking', async () => {
//             const request = createMockRequest({
//                 executeResults: [{
//                     results: [{
//                         data: 'answer',
//                         status: 200,
//                         type: JobResultType.Success,
//                     }],
//                     roundId: 0,
//                 }],
//             });

//             const mockExecute = jest.fn();
//             const mockClaim = jest.fn().mockResolvedValue(false);
//             const mockStakeOrChallenge = jest.fn();

//             request.execute = mockExecute;
//             request.claim = mockClaim;
//             request.stakeOrChallenge = mockStakeOrChallenge;
//             request.isClaimable = jest.fn(() => false);

//             const providerRegistry = createMockProviderRegistry([]);
//             const jobWalker = new JobWalker(
//                 parseNodeOptions({}),
//                 providerRegistry,
//                 createMockNodeBalance(),
//                 [request]
//             );

//             expect(jobWalker.requests.length).toBe(1);

//             providerRegistry.getDataRequestById.mockResolvedValue(request);
//             await jobWalker.walkRequest(request);

//             expect(mockExecute).toHaveBeenCalledTimes(0);
//             expect(mockClaim).toHaveBeenCalledTimes(0);
//             expect(mockStakeOrChallenge).toHaveBeenCalledTimes(1);
//             expect(jobWalker.requests.length).toBe(1);
//             expect(storeDataRequestSpy).toHaveBeenCalledTimes(1);
//         });

//         it('should execute and stake when there is no staking and no execute results', async () => {
//             const request = createMockRequest({});

//             const mockExecute = jest.fn();
//             const mockClaim = jest.fn().mockResolvedValue(false);
//             const mockStakeOrChallenge = jest.fn();
//             const mockUpdate = jest.fn();

//             request.execute = mockExecute;
//             request.update = mockUpdate;
//             request.claim = mockClaim;
//             request.stakeOrChallenge = mockStakeOrChallenge;
//             request.isClaimable = jest.fn(() => false);

//             const providerRegistry = createMockProviderRegistry([]);
//             const jobWalker = new JobWalker(
//                 parseNodeOptions({}),
//                 providerRegistry,
//                 createMockNodeBalance(),
//                 [request]
//             );

//             expect(jobWalker.requests.length).toBe(1);

//             providerRegistry.getDataRequestById.mockResolvedValue(createMockRequest());
//             await jobWalker.walkRequest(request);

//             expect(mockUpdate).toHaveBeenCalledTimes(1);
//             expect(mockExecute).toHaveBeenCalledTimes(1);
//             expect(mockClaim).toHaveBeenCalledTimes(0);
//             expect(mockStakeOrChallenge).toHaveBeenCalledTimes(1);
//             expect(jobWalker.requests.length).toBe(1);
//             expect(storeDataRequestSpy).toHaveBeenCalledTimes(1);
//         });
//     });
// });
