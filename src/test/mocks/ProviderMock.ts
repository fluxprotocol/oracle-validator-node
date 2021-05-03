export function createProviderMock(name = 'mock') {
    return {
        providerName: name,
        id: name,

        validateOptions: jest.fn(),
        init: jest.fn(),

        getTokenBalance: jest.fn(),
        getDataRequestById: jest.fn(),
        listenForRequests: jest.fn(),
        sync: jest.fn(),

        stake: jest.fn(),
        claim: jest.fn(),
        finalize: jest.fn(),
    };
}
