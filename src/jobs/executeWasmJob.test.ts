import { createMockRequest } from "../test/mocks/DataRequest";
import executeWasmJob, { convertOldSourcePath } from "./executeWasmJob";
import { ExecuteResultType, SuccessfulExecuteResult } from "@fluxprotocol/oracle-provider-core/dist/ExecuteResult";


describe('JobExecuter', () => {
    describe('convertOldSourcePath', () => {
        it('should convert an old path to the new wasm format with magic variables', () => {
            const result = convertOldSourcePath('prices[$$last][1]');

            expect(result).toBe('$.prices[-1:][1]');
        });

        it('should convert an old path to the new wasm format with non bracket array numbers', () => {
            const result = convertOldSourcePath('4.2');

            expect(result).toBe('$[4][2]');
        });

        it('should convert an old path to the new wasm format with multiple objects', () => {
            const result = convertOldSourcePath('my.object.is.a.test');

            expect(result).toBe('$.my.object.is.a.test');
        });

        it('should convert an old path to the new wasm format with objects in an array', () => {
            const result = convertOldSourcePath('my.object.0.test');

            expect(result).toBe('$.my.object[0].test');
        });

        it('should keep numbers in tact when a variable contains a number', () => {
            const result = convertOldSourcePath('my.object.na0.test');

            expect(result).toBe('$.my.object.na0.test');
        });

        it('should allow other path sources when available', () => {
            const result = convertOldSourcePath('my.object[-2].test');

            expect(result).toBe('$.my.object[-2].test');
        });
    });

    describe('executeWasmJob', () => {
        it('should be able to generate a positive answer used in staking', async () => {
            const request = createMockRequest({
                dataType: {
                    type: 'number',
                    multiplier: '1000'
                },
                sources: [
                    {
                        end_point: 'https://pokeapi.co/api/v2/pokemon/ditto',
                        source_path: 'weight',
                    },
                    {
                        end_point: 'https://pokeapi.co/api/v2/pokemon/ditto',
                        source_path: 'weight',
                    },
                    {
                        end_point: 'https://pokeapi.co/api/v2/pokemon/ditto',
                        source_path: 'weight',
                    }
                ],
            });

            const executeResult = await executeWasmJob(request);
            const result = executeResult.type === ExecuteResultType.Success ? executeResult.data.toString() : 'Error';

            expect(result).toBe('40000');
        });

        it('should be able to get the last item of an array', async () => {
            const request = createMockRequest({
                dataType: {
                    type: 'number',
                    multiplier: '1000'
                },
                sources: [
                    {
                        end_point: 'https://pokeapi.co/api/v2/pokemon/ditto',
                        source_path: 'abilities[0].slot',
                    },
                    {
                        end_point: 'https://pokeapi.co/api/v2/pokemon/ditto',
                        source_path: 'abilities[$$last].slot',
                        // source_path: '$.abilities[-1].slot'
                    },
                ],
            });

            const executeResult = await executeWasmJob(request);
            const result = executeResult.type === ExecuteResultType.Success ? executeResult.data.toString() : 'Error';

            expect(result).toBe('2000');
        });

        it('should work with a binance API', async () => {
            const request = createMockRequest({
                dataType: {
                    type: 'number',
                    multiplier: '10000000000'
                },
                sources: [
                    {
                        end_point: 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&startTime=1632994975000&endTime=1632995035000',
                        source_path: '0.4',
                    },
                ],
            });

            const executeResult = await executeWasmJob(request);
            const result = executeResult.type === ExecuteResultType.Success ? executeResult.data.toString() : 'Error';

            expect(result).toBe('430769100000000');
        });

        it('should be able to get a string from an API', async () => {
            const request = createMockRequest({
                dataType: {
                    type: 'string',
                },
                sources: [{
                    end_point: 'https://pokeapi.co/api/v2/pokemon/ditto',
                    source_path: 'abilities[1].ability.name',
                }],
            });

            const executeResult = (await executeWasmJob(request)) as SuccessfulExecuteResult;
            expect(executeResult.data).toBe('imposter');
        });

        it('should ignore a failing api source and just use the ones who are working', async () => {
            const request = createMockRequest({
                dataType: {
                    type: 'number',
                    multiplier: '1',
                },
                sources: [{
                    end_point: 'https://pokeapi.co/api/v2/pokemon/ditto',
                    source_path: 'base_experience',
                }, {
                    end_point: 'https://example.com/non_existing',
                    source_path: 'some.random.path',
                }],
            });

            const executeResult = (await executeWasmJob(request)) as SuccessfulExecuteResult;
            expect(executeResult.data).toBe('101');
        });

        it('should be able to give a full json source back', async () => {
            const request = createMockRequest({
                dataType: {
                    type: 'string',
                },
                sources: [{
                    end_point: 'https://pokeapi.co/api/v2/pokemon/ditto',
                    source_path: 'forms',
                }],
            });

            const executeResult = (await executeWasmJob(request)) as SuccessfulExecuteResult;
            expect(executeResult.data).toBe("[{\"name\":\"ditto\",\"url\":\"https://pokeapi.co/api/v2/pokemon-form/132/\"}]");
        });
    })
});
