// import { createMockRequest, DataRequestProps } from "../models/DataRequestOld";
// import * as DataRequestService from '../services/DataRequestService';
// import { parseNodeOptions } from "../models/NodeOptions";
// import { createMockProviderRegistry } from "../test/mocks/ProviderRegistry";
// import JobSearcher from "./JobSearcher";
// import { OutcomeType } from "../models/DataRequestOutcome";

// describe('JobSearcher', () => {
//     let storeDataRequestSpy: jest.SpyInstance<Promise<void>>;
//     let validDataRequest: DataRequestProps = {
//         tokenContractId: 'token.near',
//         settlementTime: 1,
//         contractId: '',
//         executeResult: undefined,
//         id: '1',
//         outcomes: [],
//         providerId: 'near',
//         resolutionWindows: [],
//         staking: [],
//         finalizedOutcome: undefined,
//         sources: [{
//             end_point: '',
//             source_path: '',
//         }],
//         finalArbitratorTriggered: false,
//         dataType: { type: 'string' },
//     };

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
//                 createMockRequest({ ...validDataRequest, id: '1' }),
//                 createMockRequest({ ...validDataRequest, id: '2' })
//             ];

//             providerRegistry.listenForRequests = jest.fn((drCallback) => {
//                 drCallback(requests);
//             });

//             const jobSearcher = new JobSearcher(
//                 providerRegistry,
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

//             jobSearcher.startSearch(onDataRequests);
//         });

//         it('should not return any requets that have not been whitelisted', (done) => {
//             const providerRegistry = createMockProviderRegistry();
//             const requests = [
//                 createMockRequest({ ...validDataRequest, id: '1', contractId: 'yes', }),
//                 createMockRequest({ ...validDataRequest, id: '2', contractId: 'no' })
//             ];

//             providerRegistry.listenForRequests = jest.fn((drCallback) => {
//                 drCallback(requests);
//             });

//             const jobSearcher = new JobSearcher(
//                 providerRegistry,
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
//             jobSearcher.startSearch(onDataRequests);
//         });

//         it('should not return any requets that are already visited', (done) => {
//             const providerRegistry = createMockProviderRegistry();
//             const requests = [
//                 createMockRequest({ ...validDataRequest, id: '1' }),
//                 createMockRequest({ ...validDataRequest, id: '2' })
//             ];

//             providerRegistry.listenForRequests = jest.fn((drCallback) => {
//                 drCallback(requests);
//             });

//             const jobSearcher = new JobSearcher(
//                 providerRegistry,
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
//             jobSearcher.startSearch(onDataRequests);
//         });

//         it('should not return any requests that have a finalized outcome', (done) => {
//             const providerRegistry = createMockProviderRegistry();
//             const requests = [
//                 createMockRequest({ ...validDataRequest, id: '1', finalizedOutcome: { type: OutcomeType.Invalid } }),
//                 createMockRequest({ ...validDataRequest, id: '2', finalizedOutcome: { type: OutcomeType.Invalid }  })
//             ];

//             providerRegistry.listenForRequests = jest.fn((drCallback) => {
//                 drCallback(requests);
//             });

//             const jobSearcher = new JobSearcher(
//                 providerRegistry,
//                 [],
//             );

//             const onDataRequests = jest.fn(() => {
//                 expect(onDataRequests).toHaveBeenCalledTimes(1);
//                 expect(onDataRequests).toHaveBeenCalledWith([]);
//                 expect(storeDataRequestSpy).toHaveBeenCalledTimes(0);
//                 expect(jobSearcher.visitedDataRequestIds).toStrictEqual([]);

//                 done();
//             });

//             expect(jobSearcher.visitedDataRequestIds).toStrictEqual([]);

//             jobSearcher.startSearch(onDataRequests);
//         });

//         it('should not return any requets that have no sources attached to them', (done) => {
//             const providerRegistry = createMockProviderRegistry();
//             const requests = [
//                 createMockRequest({ ...validDataRequest, id: '1', sources: [] }),
//                 createMockRequest({ ...validDataRequest, id: '2', sources: [] })
//             ];

//             providerRegistry.listenForRequests = jest.fn((drCallback) => {
//                 drCallback(requests);
//             });

//             const jobSearcher = new JobSearcher(
//                 providerRegistry,
//                 [],
//             );

//             const onDataRequests = jest.fn(() => {
//                 expect(onDataRequests).toHaveBeenCalledTimes(1);
//                 expect(onDataRequests).toHaveBeenCalledWith([]);
//                 expect(storeDataRequestSpy).toHaveBeenCalledTimes(0);
//                 expect(jobSearcher.visitedDataRequestIds).toStrictEqual([]);

//                 done();
//             });

//             expect(jobSearcher.visitedDataRequestIds).toStrictEqual([]);

//             jobSearcher.startSearch(onDataRequests);
//         });

//         it('should not return any requests that triggered the final arbitrator', (done) => {
//             const providerRegistry = createMockProviderRegistry();
//             const requests = [
//                 createMockRequest({ ...validDataRequest, id: '1', finalArbitratorTriggered: true }),
//                 createMockRequest({ ...validDataRequest, id: '2', finalArbitratorTriggered: true  })
//             ];

//             providerRegistry.listenForRequests = jest.fn((drCallback) => {
//                 drCallback(requests);
//             });

//             const jobSearcher = new JobSearcher(
//                 providerRegistry,
//                 [],
//             );

//             const onDataRequests = jest.fn(() => {
//                 expect(onDataRequests).toHaveBeenCalledTimes(1);
//                 expect(onDataRequests).toHaveBeenCalledWith([]);
//                 expect(storeDataRequestSpy).toHaveBeenCalledTimes(0);
//                 expect(jobSearcher.visitedDataRequestIds).toStrictEqual([]);

//                 done();
//             });

//             expect(jobSearcher.visitedDataRequestIds).toStrictEqual([]);

//             jobSearcher.startSearch(onDataRequests);
//         });
//     });
// });
