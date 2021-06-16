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
                "explorerApi": "https://testnet-oracle.flux.xyz/graphql",
                "accountId": process.env.ACCOUNT_ID,
                "privateKey": process.env.PRIVATE_KEY,
                "oracleContractId": "oracle_0.flux-dev",
                "tokenContractId": "wnear.flux-dev",
                "net": "testnet",
                "maxGas": "200000000000000",
                "storageBase": "30000000000000000000000",
                "nodeUrl": process.env.NODE_URL
            }
        }
    ]
};
