# Config options


|Key|Type|Description|Default value|
|---|---|---|---|
|debug | boolean | Logs extra information about each request. Usefull for checking why something is happening | false|
|dbPath | string | The folder path where the database will be stored | './'|
|dbName | string | The name of the database | 'flux_db'|
|stakePerRequest | string | The amount of FLX the node is allowed to spent per stake denominated in 18 decimals | '2500000000000000000' (or 2.5 FLX)|
|contractIds | string[] | Which contract ids you want to resolve, used for nodes who specificly want to resolve only their own requests. | []|
|providers | ProviderConfig[] | Configuration for each provider. Required to activate a provider.| N/A


## ProviderConfig

Each provider requires their own configuration. This is due the difference between each chain.
All providers have the `id` and options `param`.

|Key|Type|Description
|---|---|---|
|id | string | The id of the provider.
|options | object | Options of the provider

### NearProvider

`id: "near"`

The NearProvider allows the validator node to stake on the NEAR blockchain. For this provider if you want to use `credentialsStorePath` you are required to have the `near-cli` installed and be logged in:

```Bash
npm install -g near-cli
near login
```

NearProvider has the following config:

|Key|Type|Description
|---|---|---|
|credentialsStorePath | string | The path where the `.near-credentials` live. Requires you to use `near login`
|privateKey | string | If you don't want to use the `credentialsStorePath` you can also directly insert the private key (prefixed with `ed25519:`)
|explorerApi | string | The GraphQL API we will use for fetching requests
|accountId | string | The NEAR account id. This account id should be logged in (`near login`)
|oracleContractId | string | The contract account id where the oracle is living on
|tokenContractId | string | The contract id of the FLX token
|net | "testnet"/"mainnet" | Whether we are on testnet or mainnet
|maxGas | string | The maximum amount of gas that can be used for this transaction. Best to leave it at the max
|storageBase | string | The amount of NEAR to send along each contract interaction for storage. Any unused NEAR gets refuned

## Example

```JavaScript
{
    "debug": false,
    "dbPath": "./",
    "dbName": "flux_db",
    "stakePerRequest": "2500000000000000000",
    "contractIds": [],
    "providers": [
        {
            "id": "near",
            "options": {
                "credentialsStorePath": "/Users/myAccount/.near-credentials/",
                "explorerApi": "https://testnet-oracle.flux.xyz/graphql",
                "accountId": "myAccount.testnet",
                "oracleContractId": "temp-oracle.flux-dev",
                "tokenContractId": "wnear.flux-dev",
                "net": "testnet",
                "maxGas": "200000000000000",
                "storageBase": "30000000000000000000000"
            }
        }
    ]
}
```
