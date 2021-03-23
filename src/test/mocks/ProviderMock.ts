export function createProviderMock() {
    return {
        challenge: jest.fn(),
        claim: jest.fn(),
        getDataRequestById: jest.fn(),
        getDataRequests: jest.fn(),
        getTokenBalance: jest.fn(),
        id: 'mock',
        init: jest.fn(),
        providerName: 'mock',
        stake: jest.fn(),
        validateOptions: jest.fn(),
    };
}
