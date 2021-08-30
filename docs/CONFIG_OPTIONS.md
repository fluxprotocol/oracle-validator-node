# Config options

All configuration options are configured in the `.env` file. But can also be set through the environment variables locally.

|Key|Type|Description|Default value|
|---|---|---|---|
|`DEBUG`| boolean | Logs extra information about each request. Usefull for checking why something is happening | false|
|`DB_PATH` | string | The folder path where the database will be stored | './'|
|`DB_NAME` | string | The name of the database | 'flux_db'|
|`NEAR_MAX_STAKE_AMOUNT` | string | The maximum amount of FLX the node is allowed to spent per stake | '2.5' (or '2500000000000000000' FLX)|
|`ACTIVATED_PROVIDERS` | string | Comma seperated (`,`) provider ids, required to activate a provider. | N/A


## ProviderConfig

Each provider requires their own configuration. This is due the difference between each chain.

### NearProvider

The NearProvider allows the validator node to stake on the NEAR blockchain. For this provider if you want to use `credentialsStorePath` you are required to have the `near-cli` installed and be logged in:

```Bash
npm install -g near-cli
near login
```

NearProvider has the following config:

|Key|Type|Description
|---|---|---|
|`NEAR_CREDENTIALS_STORE_PATH` | string | The path where the `.near-credentials` live. Requires you to use `near login`
|`NEAR_PRIVATE_KEY` | string | If you don't want to use the `credentialsStorePath` you can also directly insert the private key (prefixed with `ed25519:`)
|`NEAR_ACCOUNT_ID` | string | The NEAR account id. This account id should match the account for the credentials store path or the private key  (`near login`)
|`NEAR_CONTRACT_ID` | string | The contract account id where the oracle is living on
|`NEAR_NETWORK_ID` | "testnet"/"mainnet" | Whether we are on testnet or mainnet
|`NEAR_MAX_STAKE_AMOUNT` | string | The maximum amount of FLX is staked for each resolution window (defaults to `2.5`) |
|`NEAR_ATTACHED_STORAGE`| string | The amount of NEAR that is deposited to the oracle for storing your stakes. Any unused NEAR can be claimed back. (defaults to `30000000000000000000000`)

## Example

```text
DEBUG = true

# Database
DB_PATH = ./
DB_NAME = flux_db

# Providers
ACTIVATED_PROVIDERS = near

# NEAR options
NEAR_CREDENTIALS_STORE_PATH = /Users/myAccount/.near-credentials/
NEAR_ACCOUNT_ID = myAccount.testnet
NEAR_RPC = https://rpc.testnet.near.org
NEAR_CONTRACT_ID = 06.oracle.flux-dev
NEAR_NETWORK_ID = testnet
NEAR_MAX_STAKE_AMOUNT = 2.5
```
