import NearProviderOptions from "../../providers/Near/NearProviderOptions";

export function createNearProviderOptionsMock(): NearProviderOptions {
    return {
        accountId: 'test',
        explorerApi: 'test.com',
        maxGas: '2',
        net: 'testnet',
        oracleContractId: 'test.dev',
        storageBase: '2',
        tokenContractId: 'test',
        privateKey: 'esdae:3424324423324fhtiuerhtiure',
        nodeUrl: 'https://rpc.testnet.near.org'
    };
}
