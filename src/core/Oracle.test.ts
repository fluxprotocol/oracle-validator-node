import Big from "big.js";
import { OutcomeType } from "@fluxprotocol/oracle-provider-core/dist/Outcome";
import { ExecuteResultType } from "../models/JobExecuteResult";
import { NodeOptions, parseNodeOptions } from "../models/NodeOptions";
import { StakeError, StakeResult, StakeResultType, UnsuccessfulStakeResult } from "@fluxprotocol/oracle-provider-core/dist/StakeResult";
import { createMockRequest } from "../test/mocks/DataRequest";
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

        it('should stake when it\'s the first round', async () => {
            const mockProviderRegistry = createMockProviderRegistry([]);

            mockProviderRegistry.stake = jest.fn(async () => {
                const x: StakeResult = {
                    amount: '1',
                    roundId: 0,
                    type: StakeResultType.Success,
                };

                return x;
            });

            const request = createMockRequest({
                providerId: 'mock',
                resolutionWindows: [{
                    round: 0,
                    endTime: new Date(),
                    bondSize: '1',
                    bondedOutcome: undefined,
                }],
                executeResult: {
                    type: ExecuteResultType.Success,
                    data: 'good_answer',
                    status: 200
                }
            });
            const result = await stakeOnDataRequest(
                mockProviderRegistry,
                request
            );

            expect(result.type === StakeResultType.Success).toBe(true);
            expect(mockProviderRegistry.stake).toHaveBeenCalledTimes(1);
            expect(mockProviderRegistry.stake).toHaveBeenCalledWith('mock', request, {
                answer: 'good_answer',
                type: OutcomeType.Answer,
            });
        });

        it('should not stake when the previous round was the same answer as we have', async () => {
            const mockProviderRegistry = createMockProviderRegistry([]);

            const result = await stakeOnDataRequest(
                mockProviderRegistry,
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
                    executeResult: {
                        type: ExecuteResultType.Success,
                        data: 'good_answer',
                        status: 200
                    },
                })
            );

            expect(result.type === StakeResultType.Error).toBe(true);
            expect((result as UnsuccessfulStakeResult).error).toBe(StakeError.AlreadyBonded);
            expect(mockProviderRegistry.stake).toHaveBeenCalledTimes(0);
        });

        it('should stake when the bonded outcome is not the correct answer', async () => {
            const mockProviderRegistry = createMockProviderRegistry([]);

            mockProviderRegistry.stake = jest.fn(async () => {
                const x: StakeResult = {
                    amount: '1',
                    roundId: 0,
                    type: StakeResultType.Success,
                };

                return x;
            });

            const request = createMockRequest({
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
                executeResult: {
                    type: ExecuteResultType.Success,
                    data: 'good_answer',
                    status: 200 ,
                }
            });
            const result = await stakeOnDataRequest(
                mockProviderRegistry,
                request
            );

            expect(result.type === StakeResultType.Success).toBe(true);
            expect(mockProviderRegistry.stake).toHaveBeenCalledTimes(1);
            expect(mockProviderRegistry.stake).toHaveBeenCalledWith('mock', request, {
                answer: 'good_answer',
                type: OutcomeType.Answer,
            });
        });
    });
});
