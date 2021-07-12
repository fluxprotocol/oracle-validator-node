import { createMockRequest } from "./DataRequest";
import { StakeError, StakeResult, StakeResultType } from "./StakingResult";
import * as JobExecuter from '../core/JobExecuter';
import * as Oracle from '../core/Oracle';
import { ExecuteResultType, ExecuteResult } from "./JobExecuteResult";
import { createMockProviderRegistry } from "../test/mocks/ProviderRegistry";
import { createMockNodeBalance } from "../test/mocks/NodeBalance";
import { ClaimResultType } from "./ClaimResult";
import { OutcomeType, transformToOutcome } from "./DataRequestOutcome";

describe('DataRequest', () => {
    describe('resolutionWindows', () => {
        it('should always return the latest resolutionWindow', () => {
            const request = createMockRequest({
                resolutionWindows: [{
                    round: 0,
                    endTime: new Date(),
                    bondSize: '2',
                }, {
                    round: 1,
                    endTime: new Date(),
                    bondSize: '2',
                }],
            });

            expect(request.currentWindow?.round).toBe(1);
        });
    });

    describe('hasStakenOnRound', () => {
        it('should return false/true based on the round staked on', () => {
            const request = createMockRequest({
                staking: [{
                    amountStaked: '1000',
                    roundId: 0,
                    type: StakeResultType.Success,
                }],
            });

            expect(request.hasStakenOnRound(1)).toBe(false);
            expect(request.hasStakenOnRound(0)).toBe(true);
        });
    });

    describe('update', () => {
        it('should update the rounds when given a new datarequest', () => {
            const request = createMockRequest({
                id: '1',
                resolutionWindows: [{
                    endTime: new Date(),
                    round: 0,
                    bondSize: '2',
                }],
            });

            request.update(createMockRequest({
                resolutionWindows: [{
                    endTime: new Date(),
                    round: 0,
                    bondSize: '2',
                }, {
                    endTime: new Date(),
                    round: 1,
                    bondSize: '2',
                }],
            }));

            expect(request.resolutionWindows.length).toBe(2);
        });
    });

    describe('isDeletable', () => {
        it('should return true when the final arbitrator has been triggered', () => {
            const request = createMockRequest({
                finalArbitratorTriggered: true,
            });

            expect(request.isDeletable()).toBe(true);
        });

        it('should return true when the request was already claimed and a finalized outcome is there', () => {
            const request = createMockRequest({
                finalizedOutcome: {
                    type: OutcomeType.Invalid,
                },
                claimedAmount: '1',
            });

            expect(request.isDeletable()).toBe(true);
        });

        it('should return false when it has not been claimed yet', () => {
            const request = createMockRequest({
                finalizedOutcome: {
                    type: OutcomeType.Invalid,
                },
                resolutionWindows: [{
                    bondSize: '2',
                    endTime: new Date(),
                    round: 0,
                }, {
                    bondSize: '4',
                    endTime: new Date(),
                    round: 1,
                }],
                staking: [{
                    amountStaked: '1',
                    roundId: 0,
                    type: StakeResultType.Success,
                }],
            });

            expect(request.isDeletable()).toBe(false);
        });

        it('should return false when there is no finalized outcome and the final arbitrator has not been triggered', () => {
            const request = createMockRequest({});

            expect(request.isDeletable()).toBe(false);
        });
    });

    describe('isClaimable', () => {
        it('should not be claimable when the request was already claimed', () => {
            const request = createMockRequest({
                claimedAmount: '1',
                resolutionWindows: [{
                    bondSize: '2',
                    endTime: new Date(1),
                    round: 0,
                    bondedOutcome: transformToOutcome('Invalid'),
                }],
                staking: [{
                    amountStaked: '2',
                    roundId: 0,
                    type: StakeResultType.Success,
                }],
            });

            expect(request.isClaimable()).toBe(false);
        });

        it('should not be claimable when the request was not staked on', () => {
            const request = createMockRequest({
                claimedAmount: '1',
                staking: [{
                    amountStaked: '1',
                    roundId: 0,
                    type: StakeResultType.Success,
                }],
                resolutionWindows: [{
                    bondSize: '2',
                    endTime: new Date(1),
                    round: 0,
                    bondedOutcome: transformToOutcome('Invalid'),
                }],
            });

            expect(request.isClaimable()).toBe(false);
        });

        it('should not be claimable when the request has no windows', () => {
            const request = createMockRequest({
                resolutionWindows: [],
            });

            expect(request.isClaimable()).toBe(false);
        });

        it('should not be calimable when the request only has one window', () => {
            const request = createMockRequest({
                resolutionWindows: [{
                    bondSize: '2',
                    endTime: new Date(1),
                    round: 0,
                    bondedOutcome: transformToOutcome('Invalid'),
                }],
            });

            expect(request.isClaimable()).toBe(false);
        });

        it('should be claimable when the current date exceeds the end time', () => {
            const request = createMockRequest({
                staking: [{
                    amountStaked: '1',
                    roundId: 0,
                    type: StakeResultType.Success,
                }],
                resolutionWindows: [{
                    bondSize: '2',
                    endTime: new Date(1),
                    round: 0,
                    bondedOutcome: transformToOutcome('Invalid'),
                },{
                    bondSize: '4',
                    endTime: new Date(1),
                    round: 1,
                    bondedOutcome: transformToOutcome('Invalid'),
                }],
            });

            expect(request.isClaimable()).toBe(true);
        });

        it('should not be claimable as a default', () => {
            const request = createMockRequest({
                staking: [{
                    amountStaked: '1',
                    roundId: 0,
                    type: StakeResultType.Success,
                }],
                resolutionWindows: [{
                    bondSize: '2',
                    endTime: new Date(new Date().getTime() + 100000),
                    round: 0,
                    bondedOutcome: transformToOutcome('Invalid'),
                }],
            });

            expect(request.isClaimable()).toBe(false);
        });
    });

    describe('execute', () => {
        let executeJobSpy: jest.SpyInstance<Promise<ExecuteResult>>;

        beforeEach(() => {
            executeJobSpy = jest.spyOn(JobExecuter, 'executeJob');
        });

        afterEach(() => {
            executeJobSpy.mockRestore();
        });

        it('should execute the job and push the results on it self', async () => {
            const request = createMockRequest({});
            executeJobSpy.mockReturnValue(new Promise((resolve) => {
                resolve({
                    type: ExecuteResultType.Success,
                    data: 'test',
                    status: 200,
                });
            }));

            await request.execute();

            expect(executeJobSpy).toBeCalled();
            expect(request.executeResult).toStrictEqual({
                type: ExecuteResultType.Success,
                data: 'test',
                status: 200,
            });
        });
    });

    describe('claim', () => {
        it('It should not set the claimedAmount when the claim was not succesful', async () => {
            const request = createMockRequest({});
            const providerRegistry = createMockProviderRegistry([]);

            providerRegistry.claim.mockReturnValue({
                type: ClaimResultType.Error,
            });

            const result = await request.claim(providerRegistry);
            expect(result).toBe(false);
            expect(request.claimedAmount).toBe(undefined);
        });

        it('It should set the claimedAmount when the claim was succesful', async () => {
            const request = createMockRequest({});
            const providerRegistry = createMockProviderRegistry([]);

            providerRegistry.claim.mockReturnValue({
                type: ClaimResultType.Success,
                received: '100',
            });

            const result = await request.claim(providerRegistry);
            expect(result).toBe(true);
            expect(request.claimedAmount).toBe('100');
        });
    });

    describe('stake', () => {
        let stakeOnDataRequestSpy: jest.SpyInstance<Promise<StakeResult>>;

        beforeEach(() => {
            stakeOnDataRequestSpy = jest.spyOn(Oracle, 'stakeOnDataRequest');
        });

        afterEach(() => {
            stakeOnDataRequestSpy.mockRestore();
        });

        it('should not stake again when the previous bonded outcome is the same as our answer', async () => {
            const request = createMockRequest({
                executeResult: {
                    type: ExecuteResultType.Success,
                    status: 200,
                    data: 'testA',
                },
                resolutionWindows: [{
                    round: 0,
                    endTime: new Date(),
                    bondSize: '2',
                    bondedOutcome: {
                        answer: 'testA',
                        type: OutcomeType.Answer,
                    },
                }, {
                    round: 1,
                    endTime: new Date(),
                    bondSize: '4',
                }],
            });

            await request.stake(
                createMockProviderRegistry([]),
                createMockNodeBalance(),
            );

            expect(request.staking.length).toBe(0);
            expect(stakeOnDataRequestSpy).toHaveBeenCalledTimes(0);
        });

        it('should not stake again when there is already staken on the round', async () => {
            const request = createMockRequest({
                resolutionWindows: [{
                    round: 0,
                    endTime: new Date(),
                    bondSize: '2',
                }],
                staking: [{
                    roundId: 0,
                    amountStaked: '1',
                    type: StakeResultType.Success,
                }],
            });

            expect(request.staking.length).toBe(1);

            await request.stake(
                createMockProviderRegistry([]),
                createMockNodeBalance(),
            );

            expect(request.staking.length).toBe(1);
            expect(stakeOnDataRequestSpy).toHaveBeenCalledTimes(0);
        });

        it('should not stake again when the request has been finalized', async () => {
            const request = createMockRequest({
                finalizedOutcome: transformToOutcome('Invalid'),
                resolutionWindows: [{
                    round: 0,
                    endTime: new Date(),
                    bondSize: '2',
                }],
                staking: [],
            });

            expect(request.staking.length).toBe(0);

            await request.stake(
                createMockProviderRegistry([]),
                createMockNodeBalance(),
            );

            expect(request.staking.length).toBe(0);
            expect(stakeOnDataRequestSpy).toHaveBeenCalledTimes(0);
        });

        it('should not add the staking when there is no execute results', async () => {
            const request = createMockRequest({
                resolutionWindows: [{
                    round: 0,
                    endTime: new Date(),
                    bondSize: '2',
                }],
            });

            stakeOnDataRequestSpy.mockReturnValue(new Promise((resolve) => {
                resolve({
                    type: StakeResultType.Error,
                    error: StakeError.Unknown,
                });
            }));

            await request.stake(
                createMockProviderRegistry([]),
                createMockNodeBalance(),
            );

            expect(request.staking.length).toBe(0);
            expect(stakeOnDataRequestSpy).toHaveBeenCalledTimes(0);
        });

        it('should not add the staking when the stake result is not succesful', async () => {
            const request = createMockRequest({
                executeResult: {
                    data: '',
                    status: 200,
                    type: ExecuteResultType.Success,
                },
                resolutionWindows: [{
                    round: 0,
                    endTime: new Date(),
                    bondSize: '2',
                }],
            });

            stakeOnDataRequestSpy.mockReturnValue(new Promise((resolve) => {
                resolve({
                    type: StakeResultType.Error,
                    error: StakeError.Unknown,
                });
            }));

            expect(request.staking.length).toBe(0);

            await request.stake(
                createMockProviderRegistry([]),
                createMockNodeBalance(),
            );

            expect(request.staking.length).toBe(0);
            expect(stakeOnDataRequestSpy).toHaveBeenCalledTimes(1);
        });

        it('should add to the staking when the stake result is succesful', async () => {
            const request = createMockRequest({
                executeResult: {
                    type: ExecuteResultType.Success,
                    data: '',
                    status: 200,
                },
                resolutionWindows: [{
                    round: 0,
                    endTime: new Date(),
                    bondSize: '2',
                }],
            });

            stakeOnDataRequestSpy.mockReturnValue(new Promise((resolve) => {
                resolve({
                    amountStaked: '1',
                    roundId: 0,
                    type: StakeResultType.Success,
                });
            }));

            expect(request.staking.length).toBe(0);

            await request.stake(
                createMockProviderRegistry([]),
                createMockNodeBalance(),
            );

            expect(request.staking.length).toBe(1);
            expect(stakeOnDataRequestSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('toString', () => {
        it('should convert the class to a string', () => {
            const request = createMockRequest({
                settlementTime: new Date(2),
                resolutionWindows: [{
                    bondSize: '1',
                    endTime: new Date(1),
                    round: 0,
                }],
            });
            const str = request.toString();

            expect(JSON.parse(str)).toStrictEqual({
                contractId: 'test.near',
                finalArbitratorTriggered: false,
                id: '1',
                internalId: '1_near_test.near',
                outcomes: [],
                providerId: 'near',
                settlementTime: "1970-01-01T00:00:00.002Z",
                resolutionWindows: [{
                    bondSize: '1',
                    endTime: '1970-01-01T00:00:00.001Z',
                    round: 0,
                }],
                sources: [],
                staking: [],
                tokenContractId: 'token.near',
                dataType: {
                    type: 'string'
                },
                type: 'DataRequest',
            });
        });
    });
});
