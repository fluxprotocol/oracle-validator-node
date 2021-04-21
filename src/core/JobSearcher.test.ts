// import { createMockRequest } from "../models/DataRequest";
// import * as DataRequestService from '../services/DataRequestService';
// import { parseNodeOptions } from "../models/NodeOptions";
// import { createMockProviderRegistry } from "../test/mocks/ProviderRegistry";
// import JobSearcher from "./JobSearcher";

// describe('JobSearcher', () => {
//     let storeDataRequestSpy: jest.SpyInstance<Promise<void>>;

//     beforeEach(() => {
//         storeDataRequestSpy = jest.spyOn(DataRequestService, 'storeDataRequest');
//         storeDataRequestSpy.mockResolvedValue();
//     });

//     afterEach(() => {
//         storeDataRequestSpy.mockRestore();
//     });

//     describe('constructor', () => {
//         it('should convert the data request to visited request ids', () => {
//             const dataRequests = [
//                 createMockRequest({ id: '1', providerId: 'mock', contractId: 'mock2' }),
//                 createMockRequest({ id: '2', providerId: 'mock', contractId: 'mock2' }),
//                 createMockRequest({ id: '3', providerId: 'mock', contractId: 'mock2' }),
//             ];

//             const jobSearcher = new JobSearcher(
//                 createMockProviderRegistry([]),
//                 parseNodeOptions({}),
//                 dataRequests
//             );

//             expect(jobSearcher.visitedDataRequestIds).toStrictEqual([
//                 '1_mock_mock2',
//                 '2_mock_mock2',
//                 '3_mock_mock2',
//             ]);
//         });
//     });

//     describe('search', () => {
//         it('should get any requests that are valid', (done) => {
//             const providerRegistry = createMockProviderRegistry();
//             const requests = [
//                 createMockRequest({ id: '1' }),
//                 createMockRequest({ id: '2' })
//             ];

//             providerRegistry.getDataRequests = jest.fn((drCallback) => {
//                 drCallback(requests);
//             });

//             const jobSearcher = new JobSearcher(
//                 providerRegistry,
//                 parseNodeOptions({}),
//                 [],
//             );

//             const onDataRequests = jest.fn(() => {
//                 expect(onDataRequests).toHaveBeenCalledTimes(1);
//                 expect(onDataRequests).toHaveBeenCalledWith(requests);
//                 expect(storeDataRequestSpy).toHaveBeenCalledTimes(2);
//                 expect(jobSearcher.visitedDataRequestIds).toStrictEqual([requests[0].internalId, requests[1].internalId]);

//                 done();
//             });

//             expect(jobSearcher.visitedDataRequestIds).toStrictEqual([]);

//             jobSearcher.search(onDataRequests);
//         });

//         it('should not return any requets that are already visited', (done) => {
//             const providerRegistry = createMockProviderRegistry();
//             const requests = [
//                 createMockRequest({ id: '1' }),
//                 createMockRequest({ id: '2' })
//             ];

//             providerRegistry.getDataRequests = jest.fn((drCallback) => {
//                 drCallback(requests);
//             });

//             const jobSearcher = new JobSearcher(
//                 providerRegistry,
//                 parseNodeOptions({}),
//                 [requests[0]],
//             );

//             const onDataRequests = jest.fn(() => {
//                 expect(onDataRequests).toHaveBeenCalledTimes(1);
//                 expect(onDataRequests).toHaveBeenCalledWith([requests[1]]);
//                 expect(storeDataRequestSpy).toHaveBeenCalledTimes(1);
//                 expect(jobSearcher.visitedDataRequestIds).toStrictEqual([requests[0].internalId, requests[1].internalId]);

//                 done();
//             });

//             expect(jobSearcher.visitedDataRequestIds).toStrictEqual([requests[0].internalId]);
//             jobSearcher.search(onDataRequests);
//         });

//         it('should not return any requets that have not been whitelisted', (done) => {
//             const providerRegistry = createMockProviderRegistry();
//             const requests = [
//                 createMockRequest({ id: '1', contractId: 'yes', }),
//                 createMockRequest({ id: '2', contractId: 'no' })
//             ];

//             providerRegistry.getDataRequests = jest.fn((drCallback) => {
//                 drCallback(requests);
//             });

//             const jobSearcher = new JobSearcher(
//                 providerRegistry,
//                 parseNodeOptions({
//                     contractIds: ['yes'],
//                 }),
//                 [],
//             );

//             const onDataRequests = jest.fn(() => {
//                 expect(onDataRequests).toHaveBeenCalledTimes(1);
//                 expect(onDataRequests).toHaveBeenCalledWith([requests[0]]);
//                 expect(storeDataRequestSpy).toHaveBeenCalledTimes(1);
//                 expect(jobSearcher.visitedDataRequestIds).toStrictEqual([requests[0].internalId]);

//                 done();
//             });

//             expect(jobSearcher.visitedDataRequestIds).toStrictEqual([]);
//             jobSearcher.search(onDataRequests);
//         });
//     });
// });
