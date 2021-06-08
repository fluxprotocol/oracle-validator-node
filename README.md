# 🔮 Flux Oracle Validator Node

## Features

* Runs requests in parallel for maximum fee earning
* Configurable staking amount
* Automatic pruning of data to keep the node small
* Automatic claiming of fees
* Re-staking on a malicious stake

## Quick start

Prerequisites: Node.js, Docker Compose, near-cli

```Bash
# save NEAR credentials to ~/.near-credentials
near login

# install packages
npm install

# generate environment variables (replacing the bracketed arguments)
npm run copyNearCredentials -- --account_id <account_id> --network <testnet/mainnet>

# start the node
./start.sh light-node .env.development
```

Use the `light-node` profile in the last command to run _only_ the oracle validator node and `full-node` to additionally run a full NEAR node and oracle explorer API.

## Configuration

Environment variables are stored in `.env.development` or `.env.production`, and if not passed as an argument to the start script, the script will prompt you to choose one.

To create and populate the `.env` file, run the utility script to copy NEAR credientials to `.env` (which auto-detects the location of your `.near-credentials` folder depending on your OS):

```Bash
npm run copyNearCredentials -- --account_id <account_id>
```

The script will prompt you to add or replace lines to your `.env.development` or `.env.production` using your NEAR account information. All information is stored locally and is included in the `.gitignore` so that it won't show up in the Git repository. You can also pass the `--network`, `--path`, and `--help` arguments.

In addition to the account information, other environment variables you can modify are:

* `stakePerRequest` to the amount you want to stake per request. Default is 2.5 FLX (2500000000000000000)

More information about the other options coming soon..

## Running the node

The node can either be run in Docker (through the commands in the quick start) or natively (with `npm start`). The advantage of running containerized versions is the ability to deploy a full node and to reuse built images.

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
