import Big from "big.js";
import DataRequest, { createMockRequest } from "../models/DataRequest";
import { isJobSuccesful, JobExecuteError, JobResultType, SuccessfulJobResult, UnsuccessfulJobResult } from "../models/JobExecuteResult";
import { executeJob, resolveJobData } from "./JobExecuter";

describe('JobExecuter', () => {
    describe('executeJob', () => {
        it('should fetch the right property correctly', async () => {
            const result = await executeJob(createMockRequest({
                id: '1',
                sources:[
                    {
                        end_point: 'https://pokeapi.co/api/v2/pokemon/ditto',
                        source_path: 'abilities[0].ability.name',
                    }
                ],
                outcomes: ['limber', 'forest'],
            }));

            expect(isJobSuccesful(result[0])).toBe(true);
        });
    });

    describe('resolveJobData', () => {
        it('should return an error when the resolve did not return anything', () => {
            const request = createMockRequest({
                outcomes: ['1', '2'],
            });

            const result = resolveJobData(request, {
                end_point: '',
                source_path: 'a.b',
            }, {});

            expect(result.type === JobResultType.Error).toBe(true);
            expect((result as UnsuccessfulJobResult).error).toBe(JobExecuteError.ValueDoesNotExist);
        });

        it('should return an error when there are outcomes but its not the result', () => {
            const request = createMockRequest({
                outcomes: ['1', '2'],
            });

            const result = resolveJobData(request, {
                end_point: '',
                source_path: 'a.b',
            }, {
                a: {
                    b: 'a',
                }
            });

            expect(result.type === JobResultType.Error).toBe(true);
            expect((result as UnsuccessfulJobResult).error).toBe(JobExecuteError.ValueNotInOutcomes);
        });

        it('should return success when it was in the outcomes', () => {
            const request = createMockRequest({
                outcomes: ['a', 'b'],
            });

            const result = resolveJobData(request, {
                end_point: '',
                source_path: 'a.b',
            }, {
                a: {
                    b: 'a',
                }
            });

            expect(result.type === JobResultType.Error).toBe(false);
            expect((result as SuccessfulJobResult<string>).data).toBe('a');
        });

        it('should return success when it resolves correctly', () => {
            const request = createMockRequest();

            const result = resolveJobData(request, {
                end_point: '',
                source_path: 'a.b',
            }, {
                a: {
                    b: 'a',
                }
            });

            expect(result.type === JobResultType.Error).toBe(false);
            expect((result as SuccessfulJobResult<string>).data).toBe('a');
        });
    });
});
