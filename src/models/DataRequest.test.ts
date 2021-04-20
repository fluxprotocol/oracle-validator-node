// import { createMockRequest } from "./DataRequest";
// import { StakeError, StakeResult, StakeResultType } from "./StakingResult";
// import * as JobExecuter from '../core/JobExecuter';
// import * as Oracle from '../core/Oracle';
// import { JobExecuteResult, JobResultType } from "./JobExecuteResult";
// import { createMockProviderRegistry } from "../test/mocks/ProviderRegistry";
// import { parseNodeOptions } from "./NodeOptions";
// import { createMockNodeBalance } from "../test/mocks/NodeBalance";
// import { ClaimResultType } from "./ClaimResult";

// describe('DataRequest', () => {
//     describe('currentRound', () => {
//         it('should always return the latest round', () => {
//             const request = createMockRequest({
//                 resolutionWindows: [{
//                     round: 0,
//                     endTime: new Date(),
//                     bondSize: '2',
//                     filled: false,
//                     totalStaked: '1',
//                 }, {
//                     round: 1,
//                     endTime: new Date(),
//                     bondSize: '2',
//                     filled: false,
//                     totalStaked: '1',
//                 }],
//             });

//             expect(request.currentWindow.round).toBe(1);
//         });
//     });

//     describe('hasStakenOnRound', () => {
//         it('should return false/true based on the round staked on', () => {
//             const request = createMockRequest({
//                 staking: [{
//                     amountStaked: '1000',
//                     roundId: 0,
//                     type: StakeResultType.Success,
//                 }],
//             });

//             expect(request.hasStakenOnRound(1)).toBe(false);
//             expect(request.hasStakenOnRound(0)).toBe(true);
//         });
//     });

//     describe('update', () => {
//         it('should update the rounds when given a new datarequest', () => {
//             const request = createMockRequest({
//                 id: '1',
//                 resolutionWindows: [{
//                     endTime: new Date(),
//                     round: 0,
//                     bondSize: '2',
//                     filled: true,
//                     totalStaked: '2',
//                 }],
//             });

//             request.update(createMockRequest({
//                 resolutionWindows: [{
//                     endTime: new Date(),
//                     round: 0,
//                     bondSize: '2',
//                     filled: true,
//                     totalStaked: '2',
//                 }, {
//                     endTime: new Date(),
//                     round: 1,
//                     bondSize: '2',
//                     filled: true,
//                     totalStaked: '2',
//                 }],
//             }));

//             expect(request.resolutionWindows.length).toBe(2);
//         });
//     });

//     describe('isClaimable', () => {
//         it('should not be claimable when the request was already claimed', () => {
//             const request = createMockRequest({
//                 claimedAmount: '1',
//             });

//             expect(request.isClaimable()).toBe(false);
//         });

//         it('should be claimable when the current date exceeds the quorom date', () => {
//             const request = createMockRequest({
//                 resolutionWindows: [{
//                     round: 0,
//                     endTime: new Date(1),
//                     bondSize: '2',
//                     filled: false,
//                     totalStaked: '1',
//                 }],
//             });

//             expect(request.isClaimable()).toBe(true);
//         });
//     });

//     describe('execute', () => {
//         let executeJobSpy: jest.SpyInstance<Promise<JobExecuteResult<string>[]>>;

//         beforeEach(() => {
//             executeJobSpy = jest.spyOn(JobExecuter, 'executeJob');
//         });

//         afterEach(() => {
//             executeJobSpy.mockRestore();
//         });

//         it('should execute the job and push the results on it self', async () => {
//             const request = createMockRequest({});
//             executeJobSpy.mockReturnValue(new Promise((resolve) => {
//                 resolve([{
//                     type: JobResultType.Success,
//                     data: 'test',
//                     status: 200,
//                 }]);
//             }));

//             await request.execute();

//             expect(executeJobSpy).toBeCalled();
//             expect(request.executeResults.length).toBe(1);
//             expect(request.executeResults[0]).toStrictEqual({
//                 roundId: 0,
//                 results: [{
//                     type: JobResultType.Success,
//                     data: 'test',
//                     status: 200,
//                 }]
//             });
//         });
//     });

//     describe('claim', () => {
//         it('It should not set the claimedAmount when the claim was not succesful', async () => {
//             const request = createMockRequest({});
//             const providerRegistry = createMockProviderRegistry([]);

//             providerRegistry.claim.mockReturnValue({
//                 type: ClaimResultType.Error,
//             });

//             const result = await request.claim(providerRegistry);
//             expect(result).toBe(false);
//             expect(request.claimedAmount).toBe(undefined);
//         });

//         it('It should set the claimedAmount when the claim was succesful', async () => {
//             const request = createMockRequest({});
//             const providerRegistry = createMockProviderRegistry([]);

//             providerRegistry.claim.mockReturnValue({
//                 type: ClaimResultType.Success,
//                 received: '100',
//             });

//             const result = await request.claim(providerRegistry);
//             expect(result).toBe(true);
//             expect(request.claimedAmount).toBe('100');
//         });
//     });

//     describe('stakeOrChallenge', () => {
//         let stakeOrChallengeSpy: jest.SpyInstance<Promise<StakeResult>>;

//         beforeEach(() => {
//             stakeOrChallengeSpy = jest.spyOn(Oracle, 'stakeOrChallengeDataRequest');
//         });

//         afterEach(() => {
//             stakeOrChallengeSpy.mockRestore();
//         });

//         it('should not stake again when there is already staken on the round', async () => {
//             const request = createMockRequest({
//                 resolutionWindows: [{
//                     round: 0,
//                     endTime: new Date(),
//                     bondSize: '2',
//                     filled: false,
//                     totalStaked: '1',
//                 }],
//                 staking: [{
//                     roundId: 0,
//                     amountStaked: '1',
//                     type: StakeResultType.Success,
//                 }],
//             });

//             expect(request.staking.length).toBe(1);

//             await request.stakeOrChallenge(
//                 parseNodeOptions({}),
//                 createMockProviderRegistry([]),
//                 createMockNodeBalance(),
//             );

//             expect(request.staking.length).toBe(1);
//         });

//         it('should not add the staking when the stake result is not succesful', async () => {
//             const request = createMockRequest({
//                 resolutionWindows: [{
//                     round: 0,
//                     endTime: new Date(),
//                     bondSize: '2',
//                     filled: false,
//                     totalStaked: '1',
//                 }],
//             });

//             stakeOrChallengeSpy.mockReturnValue(new Promise((resolve) => {
//                 resolve({
//                     type: StakeResultType.Error,
//                     error: StakeError.Unknown,
//                 });
//             }));

//             expect(request.staking.length).toBe(0);

//             await request.stakeOrChallenge(
//                 parseNodeOptions({}),
//                 createMockProviderRegistry([]),
//                 createMockNodeBalance(),
//             );

//             expect(request.staking.length).toBe(0);
//         });

//         it('should add to the staking when the stake result is succesful', async () => {
//             const request = createMockRequest({
//                 resolutionWindows: [{
//                     round: 0,
//                     endTime: new Date(),
//                     bondSize: '2',
//                     filled: false,
//                     totalStaked: '1',
//                 }],
//             });

//             stakeOrChallengeSpy.mockReturnValue(new Promise((resolve) => {
//                 resolve({
//                     amountStaked: '1',
//                     roundId: 0,
//                     type: StakeResultType.Success,
//                 });
//             }));

//             expect(request.staking.length).toBe(0);

//             await request.stakeOrChallenge(
//                 parseNodeOptions({}),
//                 createMockProviderRegistry([]),
//                 createMockNodeBalance(),
//             );

//             expect(request.staking.length).toBe(1);
//         });
//     });
// });
