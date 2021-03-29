import { createMockRequest } from "../models/DataRequest";
import { parseNodeOptions } from "../models/NodeOptions";
import { createMockProviderRegistry } from "../test/mocks/ProviderRegistry";
import JobSearcher from "./JobSearcher";

describe('JobSearcher', () => {
    describe('constructor', () => {
        it('should convert the data request to visited request ids', () => {
            const dataRequests = [
                createMockRequest({ id: '1', providerId: 'mock', contractId: 'mock2' }),
                createMockRequest({ id: '2', providerId: 'mock', contractId: 'mock2' }),
                createMockRequest({ id: '3', providerId: 'mock', contractId: 'mock2' }),
            ];

            const jobSearcher = new JobSearcher(
                createMockProviderRegistry([]),
                parseNodeOptions({}),
                dataRequests
            );

            expect(jobSearcher.visitedDataRequestIds).toStrictEqual([
                '1_mock_mock2',
                '2_mock_mock2',
                '3_mock_mock2',
            ]);
        });
    });

    describe('search', () => {

    });
});
