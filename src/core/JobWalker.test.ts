import { createMockRequest } from "../test/mocks/DataRequest";
import { createMockProviderRegistry } from "../test/mocks/ProviderRegistry";
import * as DataRequestService from '../services/DataRequestService';
import * as JobExecutor from './JobExecuter';
import * as Oracle from './Oracle';
import JobWalker from "./JobWalker";
import { StakeError, StakeResult, StakeResultType } from "@fluxprotocol/oracle-provider-core/dist/StakeResult";
import { ExecuteResultType } from "../models/JobExecuteResult";
import { OutcomeType } from "@fluxprotocol/oracle-provider-core/dist/Outcome";
import { ExecuteResult } from "@fluxprotocol/oracle-provider-core/dist/ExecuteResult";
import * as DataRequest from '@fluxprotocol/oracle-provider-core/dist/DataRequest';

describe('JobWalker', () => {
    let storeDataRequestSpy: jest.SpyInstance<Promise<void>>;
    let deleteDataRequestSpy: jest.SpyInstance<Promise<void>>;
    let executeJobDataRequestSpy: jest.SpyInstance<Promise<ExecuteResult>>;
    let stakeOnDataRequestSpy: jest.SpyInstance<Promise<StakeResult>>;
    let finalizeAndClaimSpy: jest.SpyInstance<Promise<boolean>>;
    let isRequestDeletableSpy: jest.SpyInstance<boolean>;

    beforeEach(() => {
        storeDataRequestSpy = jest.spyOn(DataRequestService, 'storeDataRequest');
        storeDataRequestSpy.mockResolvedValue();

        deleteDataRequestSpy = jest.spyOn(DataRequestService, 'deleteDataRequest');
        deleteDataRequestSpy.mockResolvedValue();

        isRequestDeletableSpy = jest.spyOn(DataRequest, 'isRequestDeletable');
        isRequestDeletableSpy.mockReturnValue(false);

        finalizeAndClaimSpy = jest.spyOn(Oracle, 'finalizeAndClaim');
        finalizeAndClaimSpy.mockResolvedValue(false);

        stakeOnDataRequestSpy = jest.spyOn(Oracle, 'stakeOnDataRequest');
        stakeOnDataRequestSpy.mockResolvedValue({
            type: StakeResultType.Error,
            error: StakeError.Unknown,
        });

        executeJobDataRequestSpy = jest.spyOn(JobExecutor, 'executeJob');
        executeJobDataRequestSpy.mockResolvedValue({
            type: ExecuteResultType.Error,
            error: 'error',
            status: 1,
        });
    });

    afterEach(() => {
        isRequestDeletableSpy.mockRestore();
        storeDataRequestSpy.mockRestore();
        deleteDataRequestSpy.mockRestore();
        executeJobDataRequestSpy.mockRestore();
        stakeOnDataRequestSpy.mockRestore();
        finalizeAndClaimSpy.mockRestore();
    });

    describe('constructor', () => {
        it('should only have requests that are not claimed yet', () => {
            isRequestDeletableSpy.mockRestore();

            const jobWalker = new JobWalker(
                createMockProviderRegistry([]),
                [
                    createMockRequest({
                        id: '1'
                    }),
                    createMockRequest({
                        id: '2'
                    }),
                    createMockRequest({
                        id: '3',
                        claimedAmount: '1',
                    }),
                ]
            );

            expect(jobWalker.requests.size).toBe(2);
        });

        it('should add requests that have been finalized and staked on but not claimed', () => {
            isRequestDeletableSpy.mockRestore();

            const jobWalker = new JobWalker(
                createMockProviderRegistry([]),
                [
                    createMockRequest({
                        id: '1',
                        resolutionWindows: [{
                            round: 0,
                            bondSize: '1',
                            endTime: new Date(),
                        }, {
                            round: 1,
                            bondSize: '1',
                            endTime: new Date(),
                        }],
                        staking: [{
                            roundId: 0,
                            amount: '1',
                            type: StakeResultType.Success,
                        }],
                        finalizedOutcome: {
                            type: OutcomeType.Invalid,
                        }
                    }),
                    createMockRequest({
                        id: '2',
                        resolutionWindows: [{
                            round: 0,
                            bondSize: '1',
                            endTime: new Date(),
                        }, {
                            round: 1,
                            bondSize: '1',
                            endTime: new Date(),
                        }],
                        staking: [{
                            roundId: 0,
                            amount: '1',
                            type: StakeResultType.Success,
                        }],
                        finalizedOutcome: {
                            answer: 'Tralala',
                            type: OutcomeType.Answer,
                        }
                    }),
                    createMockRequest({
                        id: '3',
                        resolutionWindows: [{
                            round: 0,
                            bondSize: '1',
                            endTime: new Date(),
                        }, {
                            round: 1,
                            bondSize: '1',
                            endTime: new Date(),
                        }],
                        staking: [],
                        finalizedOutcome: {
                            type: OutcomeType.Invalid,
                        }
                    }),
                ]
            );

            expect(jobWalker.requests.size).toBe(2);
        });
    });

    describe('addNewDataRequest', () => {
        it('should add a new request and push it to the job walker', async () => {
            const jobWalker = new JobWalker(
                createMockProviderRegistry([]),
                []
            );

            const request = createMockRequest({});

            stakeOnDataRequestSpy.mockResolvedValue({
                type: StakeResultType.Success,
                amount: '1',
                roundId: 0,
            });

            storeDataRequestSpy.mockResolvedValue();

            expect(jobWalker.requests.size).toBe(0);

            await jobWalker.addNewDataRequest(request);

            expect(executeJobDataRequestSpy).toBeCalledTimes(1);
            expect(stakeOnDataRequestSpy).toBeCalledTimes(1);
            expect(storeDataRequestSpy).toHaveBeenCalledTimes(1);
            expect(jobWalker.requests.size).toBe(1);
        });
    });

    describe('walkAllRequests', () => {
        it('should process requests that are not already processing', async () => {
            isRequestDeletableSpy.mockRestore();
            const request = createMockRequest({});
            const request2 = createMockRequest({
                id: '2',
            });
            const jobWalker = new JobWalker(
                createMockProviderRegistry([]),
                [request, request2]
            );

            const walkRequestMock = jest.fn();
            jobWalker.processingIds.set(request2.internalId, new Promise(() => {}));
            jobWalker.walkRequest = walkRequestMock;
            await jobWalker.walkAllRequests();

            expect(walkRequestMock).toHaveBeenCalledTimes(1);
            expect(walkRequestMock).toHaveBeenCalledWith(request);
            expect(jobWalker.processingIds.size).toBe(1);
        });
    });

    describe('walkRequest', () => {
        it('should claim when the request is claimable', async () => {
            isRequestDeletableSpy.mockRestore();

            const request = createMockRequest({
                resolutionWindows: [{
                    bondSize: '1',
                    endTime: new Date(12),
                    round: 0,
                    bondedOutcome: {
                        type: OutcomeType.Answer,
                        answer: 'test',
                    },
                }, {
                    bondSize: '1',
                    endTime: new Date(13),
                    round: 1,
                }],
                executeResult: {
                    type: ExecuteResultType.Success,
                    data: 'test',
                    status: 0,
                },
                staking: [{
                    amount: '1',
                    roundId: 0,
                    type: StakeResultType.Success,
                }],
            });

            const providerRegistry = createMockProviderRegistry([]);
            const jobWalker = new JobWalker(
                providerRegistry,
                [request]
            );

            expect(jobWalker.requests.size).toBe(1);

            finalizeAndClaimSpy.mockResolvedValue(true);

            providerRegistry.getDataRequestById.mockResolvedValue(request);
            await jobWalker.walkRequest(request);

            expect(executeJobDataRequestSpy).toHaveBeenCalledTimes(0);
            expect(finalizeAndClaimSpy).toHaveBeenCalledTimes(1);
            expect(stakeOnDataRequestSpy).toHaveBeenCalledTimes(0);
            expect(jobWalker.requests.size).toBe(0);
            expect(storeDataRequestSpy).toHaveBeenCalledTimes(0);
            expect(deleteDataRequestSpy).toHaveBeenCalledTimes(1);
        });

        it('should re-stake if there is an execute result but no staking', async () => {
            isRequestDeletableSpy.mockRestore();
            const request = createMockRequest({
                executeResult: {
                    data: 'answer',
                    status: 200,
                    type: ExecuteResultType.Success,
                }
            });

            const providerRegistry = createMockProviderRegistry([]);
            const jobWalker = new JobWalker(
                providerRegistry,
                [request]
            );

            expect(jobWalker.requests.size).toBe(1);

            providerRegistry.getDataRequestById.mockResolvedValue(request);
            await jobWalker.walkRequest(request);

            expect(executeJobDataRequestSpy).toHaveBeenCalledTimes(0);
            expect(finalizeAndClaimSpy).toHaveBeenCalledTimes(0);
            expect(stakeOnDataRequestSpy).toHaveBeenCalledTimes(1);
            expect(jobWalker.requests.size).toBe(1);
            expect(storeDataRequestSpy).toHaveBeenCalledTimes(1);
        });

        it('should execute and stake when there is no staking and no execute results', async () => {
            isRequestDeletableSpy.mockRestore();
            const request = createMockRequest({});

            executeJobDataRequestSpy.mockResolvedValue({
                type: ExecuteResultType.Success,
                data: 'good',
                status: 0,
            });

            const providerRegistry = createMockProviderRegistry([]);
            const jobWalker = new JobWalker(
                providerRegistry,
                [request]
            );

            expect(jobWalker.requests.size).toBe(1);

            providerRegistry.getDataRequestById.mockResolvedValue(createMockRequest());
            await jobWalker.walkRequest(request);

            expect(executeJobDataRequestSpy).toHaveBeenCalledTimes(1);
            expect(finalizeAndClaimSpy).toHaveBeenCalledTimes(0);
            expect(stakeOnDataRequestSpy).toHaveBeenCalledTimes(1);
            expect(jobWalker.requests.size).toBe(1);
            expect(storeDataRequestSpy).toHaveBeenCalledTimes(2);
        });

        it('should delete the request when it\'s deletable', async () => {
            const request = createMockRequest({});
            const providerRegistry = createMockProviderRegistry([]);
            const jobWalker = new JobWalker(
                providerRegistry,
                [request]
            );

            isRequestDeletableSpy.mockReturnValue(true);
            expect(jobWalker.requests.size).toBe(1);

            providerRegistry.getDataRequestById.mockResolvedValue(createMockRequest());
            await jobWalker.walkRequest(request);

            expect(executeJobDataRequestSpy).toHaveBeenCalledTimes(0);
            expect(finalizeAndClaimSpy).toHaveBeenCalledTimes(0);
            expect(stakeOnDataRequestSpy).toHaveBeenCalledTimes(0);
            expect(jobWalker.requests.size).toBe(0);
            expect(deleteDataRequestSpy).toHaveBeenCalledTimes(1);
        });
    });
});
