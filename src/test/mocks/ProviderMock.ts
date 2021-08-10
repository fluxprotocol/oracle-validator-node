export function createProviderMock(name = 'mock') {
    return {
        providerName: name,
        id: name,

        init: jest.fn(),

        getBalanceInfo: jest.fn(),
        getDataRequestById: jest.fn(),
        listenForRequests: jest.fn(),
        sync: jest.fn(),

        stake: jest.fn(),
        claim: jest.fn(),
        finalize: jest.fn(),
    };
}
