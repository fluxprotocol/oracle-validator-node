import Big from "big.js";
import { createMockRequest } from "../models/DataRequest";
import { OutcomeType } from "../models/DataRequestOutcome";
import { JobResultType } from "../models/JobExecuteResult";
import { NodeOptions, parseNodeOptions } from "../models/NodeOptions";
import { StakeError, StakeResultType, UnsuccessfulStakeResult } from "../models/StakingResult";
import { StakeResponse } from "../providers/Provider";
import ProviderRegistry from "../providers/ProviderRegistry";
import { createMockNodeBalance } from "../test/mocks/NodeBalance";
import { createProviderMock } from "../test/mocks/ProviderMock";
import { createMockProviderRegistry } from "../test/mocks/ProviderRegistry";
import { stakeOnDataRequest } from "./Oracle";

describe('Oracle', () => {
    describe('stakeOnDataRequest', () => {
        let config: NodeOptions;
        let provider = createProviderMock();

        beforeEach(() => {
            config = parseNodeOptions({});
            provider = createProviderMock();
        });

        afterEach(() => {

        });

        it('should fail when there is not enough balance', async () => {
            const nodeBalance = createMockNodeBalance();
            provider.getDataRequestById.mockReturnValue(createMockRequest({
                providerId: 'mock',
            }));

            nodeBalance.withdrawBalanceToStake.mockReturnValue(new Big(0));

            const result = await stakeOnDataRequest(
                new ProviderRegistry(config, [provider]),
                nodeBalance,
                createMockRequest({
                    providerId: 'mock',
                    executeResults: [{
                        roundId: 0,
                        results: [{ type: JobResultType.Success, data: 'd', status: 200 }],
                    }]
                })
            ) as UnsuccessfulStakeResult;

            expect(result.type === StakeResultType.Error).toBe(true);
            expect(result.error).toBe(StakeError.NotEnoughBalance);
        });

        it('should stake when it\'s the first round', async () => {
            const nodeBalance = createMockNodeBalance();
            const mockProviderRegistry = createMockProviderRegistry([]);

            mockProviderRegistry.stake = jest.fn(async () => {
                const x: StakeResponse = {
                    amountBack: new Big('1'),
                    success: true,
                };

                return x;
            });

            const result = await stakeOnDataRequest(
                mockProviderRegistry,
                nodeBalance,
                createMockRequest({
                    providerId: 'mock',
                    resolutionWindows: [{
                        round: 0,
                        endTime: new Date(),
                        bondSize: '1',
                        bondedOutcome: undefined,
                    }],
                    executeResults: [{
                        roundId: 0,
                        results: [{ type: JobResultType.Success, data: 'good_answer', status: 200 }],
                    }]
                })
            );

            expect(result.type === StakeResultType.Success).toBe(true);
            expect(mockProviderRegistry.stake).toHaveBeenCalledTimes(1);
            expect(mockProviderRegistry.stake).toHaveBeenCalledWith('mock', '1', {
                answer: 'good_answer',
                type: OutcomeType.Answer,
            }, '2500000000000000000');
        });

        it('should not stake when the previous round was the same answer as we have', async () => {
            const nodeBalance = createMockNodeBalance();
            const mockProviderRegistry = createMockProviderRegistry([]);

            const result = await stakeOnDataRequest(
                mockProviderRegistry,
                nodeBalance,
                createMockRequest({
                    providerId: 'mock',
                    resolutionWindows: [{
                        round: 0,
                        endTime: new Date(),
                        bondSize: '1',
                        bondedOutcome: {
                            answer: 'good_answer',
                            type: OutcomeType.Answer,
                        },
                    }, {
                        round: 1,
                        endTime: new Date(),
                        bondSize: '1',
                        bondedOutcome: undefined,
                    }],
                    executeResults: [{
                        roundId: 0,
                        results: [{ type: JobResultType.Success, data: 'good_answer', status: 200 }],
                    }]
                })
            );

            expect(result.type === StakeResultType.Error).toBe(true);
            expect((result as UnsuccessfulStakeResult).error).toBe(StakeError.AlreadyBonded);
            expect(mockProviderRegistry.stake).toHaveBeenCalledTimes(0);
        });

        it('should stake when the bonded outcome is not the correct answer', async () => {
            const nodeBalance = createMockNodeBalance();
            const mockProviderRegistry = createMockProviderRegistry([]);

            mockProviderRegistry.stake = jest.fn(async () => {
                const x: StakeResponse = {
                    amountBack: new Big('1'),
                    success: true,
                };

                return x;
            });

            const result = await stakeOnDataRequest(
                mockProviderRegistry,
                nodeBalance,
                createMockRequest({
                    providerId: 'mock',
                    resolutionWindows: [{
                        round: 0,
                        endTime: new Date(),
                        bondSize: '1',
                        bondedOutcome: {
                            answer: 'wrong_answer',
                            type: OutcomeType.Answer,
                        }
                    }, {
                        round: 1,
                        endTime: new Date(),
                        bondSize: '1',
                        bondedOutcome: undefined,
                    }],
                    executeResults: [{
                        roundId: 0,
                        results: [{ type: JobResultType.Success, data: 'good_answer', status: 200 }],
                    }]
                })
            );

            expect(result.type === StakeResultType.Success).toBe(true);
            expect(mockProviderRegistry.stake).toHaveBeenCalledTimes(1);
            expect(mockProviderRegistry.stake).toHaveBeenCalledWith('mock', '1', {
                answer: 'good_answer',
                type: OutcomeType.Answer,
            }, '2500000000000000000');
        });
    });
});
