export enum NetworkType {
    Mainnet = 'mainnet',
    Testnet = 'testnet'
}

export interface NetworkConfig {
    networkId: string,
    nodeUrl: string,
    contractName?: null,
    walletUrl?: string,
    initialBalance?: string
}

export function createNearNetworkConfig(net: NetworkType, rpcUrl?: string): NetworkConfig {
    if (net === NetworkType.Mainnet) {
        return {
            networkId: NetworkType.Mainnet,
            nodeUrl: 'https://rpc.mainnet.near.org',
            walletUrl: 'https://wallet.near.org',
        };
    }

    return {
        networkId: NetworkType.Testnet,
        nodeUrl: rpcUrl ?? 'https://rpc.testnet.near.org',
        contractName: null,
        walletUrl: 'https://wallet.testnet.near.org',
        initialBalance: '100000000',
    };
}
