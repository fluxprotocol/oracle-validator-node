import Big from "big.js";
import { createMockRequest } from "../models/DataRequest";
import { JobResultType } from "../models/JobExecuteResult";
import { NodeOptions, parseNodeOptions } from "../models/NodeOptions";
import ProviderRegistry from "../providers/ProviderRegistry";
import { createMockAvailableStake } from "../test/mocks/AvailableStake";
import { createProviderMock } from "../test/mocks/ProviderMock";
import { createMockProviderRegistry } from "../test/mocks/ProviderRegistry";
import { submitJobToOracle, SubmitJobToOracleError } from "./Oracle";

describe('Oracle', () => {
    describe('submitJobToOracle', () => {
        let config: NodeOptions;
        let provider = createProviderMock();

        beforeEach(() => {
            config = parseNodeOptions({});
            provider = createProviderMock();
        });

        afterEach(() => {

        });

        it('should fail when the latest data is invalid', async () => {
            provider.getDataRequestById.mockReturnValue(null);

            const result = await submitJobToOracle(
                config,
                new ProviderRegistry(config, [provider]),
                {
                    // @ts-ignore
                    availableStake: createMockAvailableStake(),
                    request: createMockRequest({
                        providerId: 'mock',
                    }),
                    result: {
                        data: '',
                        status: 200,
                        type: JobResultType.Success,
                    }
                }
            );

            expect(result.success).toBe(false);
            expect(result.error).toBe(SubmitJobToOracleError.RequestNotFound);
        });

        it('should fail when there is not enough balance', async () => {
            const availableStakeMock = createMockAvailableStake();
            provider.getDataRequestById.mockReturnValue(createMockRequest({
                providerId: 'mock',
            }));

            availableStakeMock.withdrawBalanceToStake.mockReturnValue(new Big(0));

            const result = await submitJobToOracle(
                config,
                new ProviderRegistry(config, [provider]),
                {
                    // @ts-ignore
                    availableStake: availableStakeMock,
                    request: createMockRequest({
                        providerId: 'mock',
                    }),
                    result: {
                        data: '',
                        status: 200,
                        type: JobResultType.Success,
                    }
                }
            );

            expect(result.success).toBe(false);
            expect(result.error).toBe(SubmitJobToOracleError.NotEnoughBalance);
        });

        it('should stake something as invalid when the round is challenged and the winningoutcome is not correct', async () => {
            const availableStakeMock = createMockAvailableStake();
            const mockProviderRegistry = createMockProviderRegistry([]);
            mockProviderRegistry.getDataRequestById.mockReturnValue(createMockRequest({
                providerId: 'mock',
                rounds: [{
                    round: 1,
                    outcomeStakes: new Map(),
                    quoromDate: new Date(),
                    winningOutcome: 'wrong_answer',
                }]
            }));

            mockProviderRegistry.stake.mockReturnValue({
                amountBack: new Big(0),
                success: true,
            });

            const result = await submitJobToOracle(
                config,
                mockProviderRegistry,
                {
                    // @ts-ignore
                    availableStake: availableStakeMock,
                    request: createMockRequest({
                        providerId: 'mock',
                    }),
                    result: {
                        data: 'good_answer',
                        status: 200,
                        type: JobResultType.Success,
                    }
                }
            );

            expect(result.success).toBe(true);
            expect(mockProviderRegistry.stake).toHaveBeenCalledTimes(1);
            expect(mockProviderRegistry.stake).toHaveBeenCalledWith('mock', '1', 1, undefined);
        });

        it('should stake when winning outcome is correct and round is not the first round', async () => {
            const availableStakeMock = createMockAvailableStake();
            const mockProviderRegistry = createMockProviderRegistry([]);
            mockProviderRegistry.getDataRequestById.mockReturnValue(createMockRequest({
                providerId: 'mock',
                rounds: [{
                    round: 1,
                    outcomeStakes: new Map(),
                    quoromDate: new Date(),
                    winningOutcome: 'good_answer',
                }]
            }));

            mockProviderRegistry.stake.mockReturnValue({
                amountBack: new Big(0),
                success: true,
            });

            const result = await submitJobToOracle(
                config,
                mockProviderRegistry,
                {
                    // @ts-ignore
                    availableStake: availableStakeMock,
                    request: createMockRequest({
                        providerId: 'mock',
                    }),
                    result: {
                        data: 'good_answer',
                        status: 200,
                        type: JobResultType.Success,
                    }
                }
            );

            expect(result.success).toBe(true);
            expect(mockProviderRegistry.stake).toHaveBeenCalledTimes(1);
            expect(mockProviderRegistry.stake).toHaveBeenCalledWith('mock', '1', 1, 'good_answer');
        });

        it('should stake when winning outcome is correct and round is the first round', async () => {
            const availableStakeMock = createMockAvailableStake();
            const mockProviderRegistry = createMockProviderRegistry([]);
            mockProviderRegistry.getDataRequestById.mockReturnValue(createMockRequest({
                providerId: 'mock',
                rounds: [{
                    round: 0,
                    outcomeStakes: new Map(),
                    quoromDate: new Date(),
                    winningOutcome: 'good_answer',
                }]
            }));

            mockProviderRegistry.stake.mockReturnValue({
                amountBack: new Big(0),
                success: true,
            });

            const result = await submitJobToOracle(
                config,
                mockProviderRegistry,
                {
                    // @ts-ignore
                    availableStake: availableStakeMock,
                    request: createMockRequest({
                        providerId: 'mock',
                    }),
                    result: {
                        data: 'good_answer',
                        status: 200,
                        type: JobResultType.Success,
                    }
                }
            );

            expect(result.success).toBe(true);
            expect(mockProviderRegistry.stake).toHaveBeenCalledTimes(1);
            expect(mockProviderRegistry.stake).toHaveBeenCalledWith('mock', '1', 0, 'good_answer');
        });
    });
});
