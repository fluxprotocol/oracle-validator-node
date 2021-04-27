import * as fetchModule from 'node-fetch';
import { createMockRequest } from "../models/DataRequest";
import { isJobSuccesful, JobExecuteError, JobResultType, SuccessfulJobResult, UnsuccessfulJobResult } from "../models/JobExecuteResult";
import { executeJob, resolveJobData } from "./JobExecuter";

describe('JobExecuter', () => {
    let fetchSpy: jest.SpyInstance<Promise<fetchModule.Response>>;

    beforeEach(() => {
        fetchSpy = jest.spyOn(fetchModule, 'default');
    });

    afterEach(() => {
        fetchSpy.mockRestore();
    });

    describe('executeJob', () => {
        it('should return a ResponseNotOk error when the response status was not ok', async () => {
            fetchSpy.mockResolvedValue(new fetchModule.Response('', { status: 500 }));

            const result = await executeJob(createMockRequest({
                id: '1',
                sources: [
                    {
                        end_point: 'https://test.com/api',
                        source_path: 'a.b',
                    }
                ],
                outcomes: ['limber', 'forest'],
            }));

            expect(fetchSpy).toHaveBeenCalledTimes(1);
            expect(result[0].type).toBe(JobResultType.Error);
            expect(result[0].status).toBe(500);
            expect((result[0] as UnsuccessfulJobResult).error).toBe(JobExecuteError.ResponseNotOk);
        });

        it('should return a ResponseNotJson when the given response was not valid JSON', async () => {
            fetchSpy.mockResolvedValue(new fetchModule.Response('', { status: 200 }));

            const result = await executeJob(createMockRequest({
                id: '1',
                sources: [
                    {
                        end_point: 'https://test.com/api',
                        source_path: 'a.b',
                    }
                ],
                outcomes: ['limber', 'forest'],
            }));

            expect(fetchSpy).toHaveBeenCalledTimes(1);
            expect(result[0].type).toBe(JobResultType.Error);
            expect(result[0].status).toBe(200);
            expect((result[0] as UnsuccessfulJobResult).error).toBe(JobExecuteError.ResponseNotJson);
        });

        it('should fetch the right property correctly', async () => {
            fetchSpy.mockResolvedValue(new fetchModule.Response('{ "a": { "b": "limber" } }'));

            const result = await executeJob(createMockRequest({
                id: '1',
                sources:[
                    {
                        end_point: 'https://test.com/api',
                        source_path: 'a.b',
                    }
                ],
                outcomes: ['limber', 'forest'],
            }));

            expect(fetchSpy).toHaveBeenCalledTimes(1);
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
