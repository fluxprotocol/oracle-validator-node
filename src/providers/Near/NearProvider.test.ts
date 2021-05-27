import { createNearProviderOptionsMock } from "../../test/mocks/NearProviderOptionsMock";
import NearProvider from "./NearProvider";
import * as NearExplorerService from './NearExplorerService';
import { createMockRequest } from "../../models/DataRequest";
import { OutcomeType } from "../../models/DataRequestOutcome";

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
                            Answer: 'test'
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
});
