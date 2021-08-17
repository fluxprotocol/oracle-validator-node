import DataRequest, { buildInternalId } from "@fluxprotocol/oracle-provider-core/dist/DataRequest";

export function createMockRequest(request: Partial<DataRequest> = {}): DataRequest {
    const id = request.id ?? '1';
    const providerId = request.providerId ?? 'near';

    return {
        id,
        outcomes: [],
        resolutionWindows: [
            {
                endTime: new Date(),
                round: 0,
                bondSize: '2',
            }
        ],
        sources: [],
        providerId,
        executeResult: undefined,
        staking: [],
        claimedAmount: undefined,
        finalArbitratorTriggered: false,
        finalizedOutcome: undefined,
        dataType: { type: 'string' },
        ...request,
        internalId: buildInternalId(id, providerId, ''),
    };
}
