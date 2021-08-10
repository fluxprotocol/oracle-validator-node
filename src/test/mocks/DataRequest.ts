import DataRequest from "@fluxprotocol/oracle-provider-core/dist/DataRequest";

export function createMockRequest(request: Partial<DataRequest> = {}): DataRequest {
    return {
        id: '1',
        outcomes: [],
        resolutionWindows: [
            {
                endTime: new Date(),
                round: 0,
                bondSize: '2',
            }
        ],
        sources: [],
        providerId: 'near',
        executeResult: undefined,
        staking: [],
        claimedAmount: undefined,
        finalArbitratorTriggered: false,
        finalizedOutcome: undefined,
        settlementTime: new Date(1),
        dataType: { type: 'string' },
        internalId: 'near_1',
        ...request,
    };
}
