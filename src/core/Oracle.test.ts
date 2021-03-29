import Big from "big.js";
import { createMockRequest } from "../models/DataRequest";
import { JobResultType } from "../models/JobExecuteResult";
import { NodeOptions, parseNodeOptions } from "../models/NodeOptions";
import { StakeError, StakeResultType, UnsuccessfulStakeResult } from "../models/StakingResult";
import ProviderRegistry from "../providers/ProviderRegistry";
import { createMockNodeBalance } from "../test/mocks/NodeBalance";
import { createProviderMock } from "../test/mocks/ProviderMock";
import { createMockProviderRegistry } from "../test/mocks/ProviderRegistry";
import { stakeOrChallengeDataRequest } from "./Oracle";

describe('Oracle', () => {
    describe('stakeOrChallengeDataRequest', () => {
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

            const result = await stakeOrChallengeDataRequest(
                config,
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

        it('should stake something as invalid when the round is challenged and the winningoutcome is not correct', async () => {
            const nodeBalance = createMockNodeBalance();
            const mockProviderRegistry = createMockProviderRegistry([]);
            mockProviderRegistry.challenge.mockReturnValue({
                amountBack: new Big(0),
                success: true,
            });

            const result = await stakeOrChallengeDataRequest(
                config,
                mockProviderRegistry,
                nodeBalance,
                createMockRequest({
                    providerId: 'mock',
                    rounds: [{
                        round: 1,
                        outcomeStakes: {},
                        quoromDate: new Date().toJSON(),
                        winningOutcome: 'wrong_answer',
                    }],
                    executeResults: [{
                        roundId: 0,
                        results: [{ type: JobResultType.Success, data: 'good_answer', status: 200 }],
                    }]
                })
            );

            expect(result.type === StakeResultType.Success).toBe(true);
            expect(mockProviderRegistry.challenge).toHaveBeenCalledTimes(1);
            expect(mockProviderRegistry.challenge).toHaveBeenCalledWith('mock', '1', 1, 'good_answer');
        });

        it('should stake when winning outcome is correct and round is not the first round', async () => {
            const nodeBalance = createMockNodeBalance();
            const mockProviderRegistry = createMockProviderRegistry([]);

            mockProviderRegistry.stake.mockReturnValue({
                amountBack: new Big(0),
                success: true,
            });

            const result = await stakeOrChallengeDataRequest(
                config,
                mockProviderRegistry,
                nodeBalance,
                createMockRequest({
                    providerId: 'mock',
                    rounds: [{
                        round: 1,
                        outcomeStakes: {},
                        quoromDate: new Date().toJSON(),
                        winningOutcome: 'good_answer',
                    }],
                    executeResults: [{
                        roundId: 0,
                        results: [{ type: JobResultType.Success, data: 'good_answer', status: 200 }],
                    }]
                })
            );

            expect(result.type === StakeResultType.Success).toBe(true);
            expect(mockProviderRegistry.stake).toHaveBeenCalledTimes(1);
            expect(mockProviderRegistry.stake).toHaveBeenCalledWith('mock', '1', 1, 'good_answer');
        });

        it('should stake when winning outcome is correct and round is the first round', async () => {
            const nodeBalance = createMockNodeBalance();
            const mockProviderRegistry = createMockProviderRegistry([]);

            mockProviderRegistry.stake.mockReturnValue({
                amountBack: new Big(0),
                success: true,
            });

            const result = await stakeOrChallengeDataRequest(
                config,
                mockProviderRegistry,
                nodeBalance,
                createMockRequest({
                    providerId: 'mock',
                    rounds: [{
                        round: 0,
                        outcomeStakes: {},
                        quoromDate: new Date().toJSON(),
                        winningOutcome: 'good_answer',
                    }],
                    executeResults: [{
                        roundId: 0,
                        results: [{ type: JobResultType.Success, data: 'good_answer', status: 200 }],
                    }]
                })
            );

            expect(result.type === StakeResultType.Success).toBe(true);
            expect(mockProviderRegistry.stake).toHaveBeenCalledTimes(1);
            expect(mockProviderRegistry.stake).toHaveBeenCalledWith('mock', '1', 0, 'good_answer');
        });
    });
});
