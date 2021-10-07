# 🔮 Flux Oracle Validator Node

⚠️ This software is still in BETA and should not be used in production yet, beware of dragons 🐉

## Features

* Runs requests in parallel for maximum fee earning
* Configurable staking amount
* Automatic pruning of data to keep the node small
* Automatic claiming of fees and unstaking unbonded outcomes
* Re-staking on a mallicious stake

## Installation

The validator node requires you to have node.js installed (This project has been developed and tested on `v14.15.4`). After installing you can run:

```Bash
npm install
```

After this you need to login with your near credentials using:

```Bash
npm install -g near-cli
near login
```

## Configuration

Copy the `.env.example` and name it `.env` and change the following options:

* `NEAR_MAX_STAKE_AMOUNT` to the maximum amount you want to stake per resolution window. Default is 2.5 FLX
* `NEAR_CREDENTIALS_STORE_PATH` to the path where your `.near-credentials` are stored. Must be the full path (Usually it's located in your home directory)
* `NEAR_ACCOUNT_ID` to the account id you previously logged in with (using `near login`)
* `NEAR_CONTRACT_ID` to the current oracle contract
* `NEAR_NETWORK_ID` either `testnet` or `mainnet`

### Environment configs

For `testnet` the latest config params are:

```
NEAR_NETWORK_ID = testnet
NEAR_CONTRACT_ID = 07.oracle.flux-dev
```

For `mainnet` the latest config params are:

```
tbd
```

## Running the node

```Bash
npm start
```

If everything went correctly you should see something like the following:

```
2021-04-28 10:30:37 info: 🤖 Starting oracle node v1.0.0 for NEAR..
2021-04-28 10:30:37 info: 🛠  Staking per request 2.50 FLX
2021-04-28 10:30:37 info: 🛠  Listening to all contracts
2021-04-28 10:30:37 info: 🔄 Syncing for near starting from request id 0
2021-04-28 10:30:59 info: ✅ Syncing completed for near
2021-04-28 10:30:37 info: 💸 Balance: 1440800.53 FLX, Staking: 0.00 FLX, Profit: 0.00 FLX, Jobs actively watching: 0
```

It can take some time for syncing to complete. Once it's finished it will start looking for jobs and execute them.
