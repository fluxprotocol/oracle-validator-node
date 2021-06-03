module.exports = {
    "debug": false,
    "dbPath": "./",
    "dbName": "flux_db",
    "stakePerRequest": process.env.STAKE_PER_REQUEST,
    "contractIds": [],
    "providers": [
        {
            "id": "near",
            "options": {
                "credentialsStorePath": "/opt/near-credentials/",
                "explorerApi": "https://testnet-oracle.flux.xyz/graphql",
                "accountId": process.env.ACCOUNT_ID,
                "oracleContractId": "oracle_0.flux-dev",
                "tokenContractId": "wnear.flux-dev",
                "net": "testnet",
                "maxGas": "200000000000000",
                "storageBase": "30000000000000000000000"
            }
        }
    ]
};
