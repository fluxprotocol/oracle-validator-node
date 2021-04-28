import { createMockRequest } from '../models/DataRequest';
import { LatestRequest } from '../models/LatestRequest';
import Database from '../services/DatabaseService';
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
            expect(createOrUpdateDocumentSpy).toHaveBeenCalledWith(request.providerId + '_latest_request', {
                id: request.id,
                provider: request.providerId,
                type: 'LATEST_REQUEST',
            } as LatestRequest);
        });

        it('should not store the request as latest when the provider already has a newer request', async () => {
            const syncer = new NodeSyncer(createMockProviderRegistry());

            syncer.latestDataRequests.set('near', {
                id: '4',
                provider: 'near',
                type: 'LATEST_REQUEST',
            });

            syncer.latestDataRequests.set('test', {
                id: '2',
                provider: 'test',
                type: 'LATEST_REQUEST',
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
                type: 'LATEST_REQUEST',
            });

            expect(syncer.latestDataRequests.get('test')).toStrictEqual({
                id: '2',
                provider: 'test',
                type: 'LATEST_REQUEST',
            });
        });

        it('should store the request as latest, when the request is newer', async () => {
            const syncer = new NodeSyncer(createMockProviderRegistry());

            syncer.latestDataRequests.set('near', {
                id: '4',
                provider: 'near',
                type: 'LATEST_REQUEST',
            });

            syncer.latestDataRequests.set('test', {
                id: '2',
                provider: 'test',
                type: 'LATEST_REQUEST',
            });


            const request = createMockRequest({
                id: '5',
                providerId: 'near',
            });

            await syncer.updateLatestDataRequest(request);

            expect(syncer.latestDataRequests.size).toBe(2);
            expect(createOrUpdateDocumentSpy).toHaveBeenCalledTimes(1);
            expect(createOrUpdateDocumentSpy).toHaveBeenCalledWith(request.providerId + '_latest_request', {
                id: request.id,
                provider: request.providerId,
                type: 'LATEST_REQUEST',
            } as LatestRequest);

            expect(syncer.latestDataRequests.get('near')).toStrictEqual({
                id: '5',
                provider: 'near',
                type: 'LATEST_REQUEST',
            });

            expect(syncer.latestDataRequests.get('test')).toStrictEqual({
                id: '2',
                provider: 'test',
                type: 'LATEST_REQUEST',
            });
        });
    });
});
