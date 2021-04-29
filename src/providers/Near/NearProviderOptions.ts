export default interface NearProviderOptions {
    privateKey?: string;
    credentialsStorePath?: string;
    net: string;
    accountId: string;
    oracleContractId: string;
    tokenContractId: string;
    explorerApi: string;
    maxGas: string;
    storageBase: string;
}
