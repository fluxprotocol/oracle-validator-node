import { createNearProviderOptionsMock } from "../../test/mocks/NearProviderOptionsMock";
import NearProvider from "./NearProvider";
import * as NearExplorerService from './NearExplorerService';
import { createMockRequest } from "../../models/DataRequest";
import { OutcomeType } from "../../models/DataRequestOutcome";
import { StakeResultType } from "../../models/StakingResult";
import { ExecuteResultType } from "../../models/JobExecuteResult";

describe('NearProvider', () => {
    let getDataRequestsAsCursorFromNearSpy: jest.SpyInstance<Promise<NearExplorerService.GetDataRequestsAsCursorResult>>;

    beforeEach(() => {
        getDataRequestsAsCursorFromNearSpy = jest.spyOn(NearExplorerService, 'getDataRequestsAsCursorFromNear');
    });

    afterEach(() => {
        getDataRequestsAsCursorFromNearSpy.mockRestore();
    });

    describe('stake', () => {
        it('should stake invalid when the outcome type is invalid', async () => {
            const nearProvider = new NearProvider();
            const options = createNearProviderOptionsMock();
            const dataRequest = createMockRequest();
            nearProvider.nearOptions = options;
            const functionCall = jest.fn(async () => ({
                receipts_outcome: [{
                    outcome: {
                        logs: ['{ "type": "user_stakes", "params": { "total_stake": "20" } }'],
                    }
                }],
            }));

            // @ts-ignore
            nearProvider.nodeAccount = {
                // @ts-ignore
                functionCall,
            };

            const response = await nearProvider.stake(dataRequest, { type: OutcomeType.Invalid }, '100');

            expect(functionCall).toHaveBeenCalledTimes(1);
            expect(functionCall).toHaveBeenCalledWith(options.tokenContractId, 'ft_transfer_call', {
                receiver_id: options.oracleContractId,
                amount: '100',
                msg: JSON.stringify({
                    'StakeDataRequest': {
                        id: '1',
                        outcome: 'Invalid',
                    }
                }),
            }, options.maxGas, '1');

            expect(response.amountBack.toString()).toBe('80');
            expect(response.success).toBe(true);
        });

        it('should stake valid when the outcome type is valid', async () => {
            const nearProvider = new NearProvider();
            const options = createNearProviderOptionsMock();
            const dataRequest = createMockRequest();
            nearProvider.nearOptions = options;
            const functionCall = jest.fn(async () => ({
                receipts_outcome: [{
                    outcome: {
                        logs: ['{ "type": "user_stakes", "params": { "total_stake": "20" } }'],
                    }
                }],
            }));

            // @ts-ignore
            nearProvider.nodeAccount = {
                // @ts-ignore
                functionCall,
            };

            const response = await nearProvider.stake(dataRequest, { type: OutcomeType.Answer, answer: 'test' }, '100');

            expect(functionCall).toHaveBeenCalledTimes(1);
            expect(functionCall).toHaveBeenCalledWith(options.tokenContractId, 'ft_transfer_call', {
                receiver_id: options.oracleContractId,
                amount: '100',
                msg: JSON.stringify({
                    'StakeDataRequest': {
                        id: '1',
                        outcome: {
                            Answer: {
                                String: 'test'
                            }
                        },
                    }
                }),
            }, options.maxGas, '1');

            expect(response.amountBack.toString()).toBe('80');
            expect(response.success).toBe(true);
        });
    });

    describe('getNextRequests', () => {
        it('should get the requests from the api using 0 as starting point when no current id is set', async () => {
            const nearProvider = new NearProvider();
            const options = createNearProviderOptionsMock();
            nearProvider.nearOptions = options;
            nearProvider.currentRequestId = undefined;

            getDataRequestsAsCursorFromNearSpy.mockResolvedValue({
                items: [createMockRequest()],
                next: '1',
            });

            await nearProvider.getNextRequests();

            expect(getDataRequestsAsCursorFromNearSpy).toHaveBeenCalledTimes(1);
            expect(getDataRequestsAsCursorFromNearSpy).toHaveBeenCalledWith(options, {
                limit: 100,
                startingRequestId: '0',
            });
            expect(nearProvider.currentRequestId).toBe('1');
        });

        it('should not update the request id when there is no next request', async () => {
            const nearProvider = new NearProvider();
            const options = createNearProviderOptionsMock();
            nearProvider.nearOptions = options;
            nearProvider.currentRequestId = '2';

            getDataRequestsAsCursorFromNearSpy.mockResolvedValue({
                items: [],
                next: null,
            });

            await nearProvider.getNextRequests();

            expect(getDataRequestsAsCursorFromNearSpy).toHaveBeenCalledTimes(1);
            expect(getDataRequestsAsCursorFromNearSpy).toHaveBeenCalledWith(options, {
                limit: 100,
                startingRequestId: '2',
            });

            expect(nearProvider.currentRequestId).toBe('2');
        });
    });

    describe('sync', () => {
        it('should call onRequest twice when there is more', async () => {
            const nearProvider = new NearProvider();
            const options = createNearProviderOptionsMock();
            nearProvider.nearOptions = options;
            nearProvider.currentRequestId = undefined;

            getDataRequestsAsCursorFromNearSpy.mockResolvedValue({
                items: [createMockRequest()],
                next: '1',
            });

            const onRequest = jest.fn(() => {
                getDataRequestsAsCursorFromNearSpy.mockResolvedValue({
                    items: [],
                    next: null,
                });
            });

            await nearProvider.sync('0', onRequest);

            expect(onRequest).toHaveBeenCalledTimes(1);
            expect(nearProvider.currentRequestId).toBe('1');
        });
    });

    describe('claim', () => {
        it('should claim any unbonded stake', async () => {
            const nearProvider = new NearProvider();
            const dataRequest = createMockRequest({
                executeResult: {
                    type: ExecuteResultType.Success,
                    data: 'pizza',
                    status: 0,
                },
                staking: [{
                    type: StakeResultType.Success,
                    amountStaked: '250000000',
                    roundId: 0,
                }],
                resolutionWindows: [{
                    bondSize: '2',
                    endTime: new Date(),
                    round: 0,
                    bondedOutcome: {
                        answer: 'test',
                        type: OutcomeType.Answer,
                    }
                }, {
                    bondSize: '4',
                    endTime: new Date(),
                    round: 1,
                    bondedOutcome: {
                        answer: 'test2',
                        type: OutcomeType.Answer,
                    }
                }],
            });

            const options = createNearProviderOptionsMock();
            nearProvider.nearOptions = options;

            // @ts-ignore
            nearProvider.nodeAccount = {
                functionCall: jest.fn(() => new Promise((resolve) => {
                    // @ts-ignore
                    resolve({
                        receipts_outcome: [{
                            id: '',
                            outcome: {
                                gas_burnt: 1,
                                receipt_ids: [],
                                // @ts-ignore
                                status: 1,
                                logs: ['{"type": "claims", "params": { "payout": "25", "user_correct_stake": "250000000" }}'],
                            },
                        }],
                    });
                })),
            };

            const result = await nearProvider.claim(dataRequest);

            // 1 for unstaking and 1 for claiming
            expect(nearProvider.nodeAccount?.functionCall).toHaveBeenCalledTimes(2);

            expect(result.type).toBe('success');
            // @ts-ignore
            expect(result.received).toBe('250000025');
        });
    });
});
