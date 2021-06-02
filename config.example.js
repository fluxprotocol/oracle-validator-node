module.exports = {
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
                "accountId": process.env.ACCOUNT_ID,
                "oracleContractId": "temp-oracle.flux-dev",
                "tokenContractId": "wnear.flux-dev",
                "net": "testnet",
                "maxGas": "200000000000000",
                "storageBase": "30000000000000000000000"
            }
        }
    ]
};
