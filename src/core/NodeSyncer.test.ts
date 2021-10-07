import { LatestRequest } from '../models/LatestRequest';
import Database from '../services/DatabaseService';
import { createMockRequest } from '../test/mocks/DataRequest';
import { createMockProviderRegistry } from "../test/mocks/ProviderRegistry";
import NodeSyncer from "./NodeSyncer";

describe('NodeSyncer', () => {
    let createOrUpdateDocumentSpy: jest.SpyInstance<Promise<void>>

    beforeEach(() => {
        createOrUpdateDocumentSpy = jest.spyOn(Database, 'createOrUpdateDocument');
        createOrUpdateDocumentSpy.mockResolvedValue();
    });

    afterEach(() => {
        createOrUpdateDocumentSpy.mockRestore();
    });

    describe('updateLatestDataRequest', () => {
        it('should store the request as latest request when there are no requests available', async () => {
            const syncer = new NodeSyncer(createMockProviderRegistry());
            const request = createMockRequest();
            await syncer.updateLatestDataRequest(request);

            expect(syncer.latestDataRequests.has(request.providerId));
            expect(syncer.latestDataRequests.size).toBe(1);
            expect(createOrUpdateDocumentSpy).toHaveBeenCalledTimes(1);
            expect(createOrUpdateDocumentSpy).toHaveBeenCalledWith('sync', request.providerId + '_latest_request', {
                id: request.id,
                provider: request.providerId,
                internalId: '1_near_',
            } as LatestRequest);
        });

        it('should not store the request as latest when the provider already has a newer request', async () => {
            const syncer = new NodeSyncer(createMockProviderRegistry());

            syncer.latestDataRequests.set('near', {
                id: '4',
                provider: 'near',
            });

            syncer.latestDataRequests.set('test', {
                id: '2',
                provider: 'test',
            });


            const request = createMockRequest({
                id: '3',
                providerId: 'near',
            });

            await syncer.updateLatestDataRequest(request);

            expect(syncer.latestDataRequests.size).toBe(2);
            expect(createOrUpdateDocumentSpy).toHaveBeenCalledTimes(0);
            expect(syncer.latestDataRequests.get('near')).toStrictEqual({
                id: '4',
                provider: 'near',
            });

            expect(syncer.latestDataRequests.get('test')).toStrictEqual({
                id: '2',
                provider: 'test',
            });
        });

        it('should store the request as latest, when the request is newer', async () => {
            const syncer = new NodeSyncer(createMockProviderRegistry());

            syncer.latestDataRequests.set('near', {
                id: '4',
                provider: 'near',
            });

            syncer.latestDataRequests.set('test', {
                id: '2',
                provider: 'test',
            });


            const request = createMockRequest({
                id: '5',
                providerId: 'near',
            });

            await syncer.updateLatestDataRequest(request);

            expect(syncer.latestDataRequests.size).toBe(2);
            expect(createOrUpdateDocumentSpy).toHaveBeenCalledTimes(1);
            expect(createOrUpdateDocumentSpy).toHaveBeenCalledWith('sync', request.providerId + '_latest_request', {
                id: request.id,
                provider: request.providerId,
                internalId: '5_near_',
            } as LatestRequest);

            expect(syncer.latestDataRequests.get('near')).toStrictEqual({
                id: '5',
                internalId: '5_near_',
                provider: 'near',
            });

            expect(syncer.latestDataRequests.get('test')).toStrictEqual({
                id: '2',
                provider: 'test',
            });
        });
    });
});
