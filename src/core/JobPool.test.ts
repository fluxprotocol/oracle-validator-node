import { JobResultType } from "../models/JobExecuteResult";
import * as JobExecuter from './JobExecuter';
import JobPool from "./JobPool";

describe('JobPool', () => {
    describe('addRequest', () => {
        it('should be able to add a request to the pool', () => {
            const pool = new JobPool();
            const item = {
                id: '1',
                rounds: [],
                source: '',
                sourcePath: '',
            };

            expect(pool.length).toBe(0);

            pool.addRequest(item);

            expect(pool.length).toBe(1);
            expect(pool.requests[0]).toStrictEqual(item);
        });

        it('should not be able to add duplicates', () => {
            const pool = new JobPool();
            const item = {
                id: '1',
                rounds: [],
                source: '',
                sourcePath: '',
            };

            expect(pool.length).toBe(0);

            pool.addRequest(item);
            pool.addRequest(item);
            pool.addRequest(item);
            pool.addRequest(item);

            expect(pool.length).toBe(1);
        });

        it('should not add when the request is already being processed', () => {
            const pool = new JobPool();
            const item = {
                id: '1',
                rounds: [],
                source: '',
                sourcePath: '',
            };

            pool.processing.push('1');
            expect(pool.length).toBe(0);

            pool.addRequest(item);

            expect(pool.length).toBe(0);
        });

        it('should not add when the request already was processed', () => {
            const pool = new JobPool();
            const item = {
                id: '1',
                rounds: [],
                source: '',
                sourcePath: '',
            };

            pool.processedRequests.set('1', {
                request: item,
                result: {
                    data: '',
                    type: JobResultType.Success,
                    status: 200,
                },
            });

            expect(pool.length).toBe(0);

            pool.addRequest(item);

            expect(pool.length).toBe(0);
        });
    });

    describe('shiftRequest', () => {
        it('should get the last item and remove it from the request stack', () => {
            const pool = new JobPool();
            const item = {
                id: '1',
                rounds: [],
                source: '',
                sourcePath: '',
            };

            pool.addRequest(item);
            expect(pool.length).toBe(1);
            const returnedItem = pool.shiftRequest();

            expect(pool.length).toBe(0);
            expect(returnedItem).toBeDefined();
        });

        it('should return undefined when there are no more items on the stack', () => {
            const pool = new JobPool();
            const item = {
                id: '1',
                rounds: [],
                source: '',
                sourcePath: '',
            };

            pool.addRequest(item);
            expect(pool.length).toBe(1);
            pool.shiftRequest();
            expect(pool.length).toBe(0);

            const secondItem = pool.shiftRequest();
            expect(pool.length).toBe(0);
            expect(secondItem).toBeUndefined();
        });
    });

    describe('process', () => {
        let mockExecuteJob: any;

        beforeEach(() => {
            mockExecuteJob = jest.spyOn(JobExecuter, 'executeJob');
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should add the request to the processing', async () => {
            const pool = new JobPool();
            const item = {
                id: '1',
                rounds: [],
                source: '',
                sourcePath: '',
            };

            mockExecuteJob.mockReturnValue({
                request: item,
                result: {
                    status: 200,
                    type: 'success',
                    data: 'test',
                }
            });

            pool.addRequest(item);
            const onItemProcessed = jest.fn();
            await pool.process(onItemProcessed);

            expect(pool.processedRequests.size).toBe(1);
            expect(pool.processedRequests.get('1')).toBeDefined();
            expect(pool.processing.length).toBe(0);
            expect(pool.requests.length).toBe(0);

            expect(mockExecuteJob).toHaveBeenCalledTimes(1);
            expect(onItemProcessed).toHaveBeenCalledTimes(1);
        });


        it('should do nothing when no requests are available', async () => {
            const pool = new JobPool();

            await pool.process(() => { });

            expect(pool.processedRequests.size).toBe(0);
            expect(pool.processing.length).toBe(0);
            expect(pool.requests.length).toBe(0);
            expect(mockExecuteJob).toHaveBeenCalledTimes(0);
        });
    })
});
