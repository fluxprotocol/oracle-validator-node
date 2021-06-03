# 🔮 Flux Oracle Validator Node

## Features

* Runs requests in parallel for maximum fee earning
* Configurable staking amount
* Automatic pruning of data to keep the node small
* Automatic claiming of fees
* Re-staking on a malicious stake

## Getting started

The node can either be run natively (Node.js) or Docker with no external dependencies. Both require first logging into the near-cli:

```Bash
npm install -g near-cli
near login
```
## Configuration

Environment variables are stored in `.env` so that it can be injected into `config.js` from Docker and Node.js.

To create and populate the `.env` file, run the utility script to copy NEAR credientials to `.env` (which auto-detects the location of your `.near-credentials` folder depending on your OS):

```Bash
node utils.js copy-near-credentials --account_id <account_id>
```

The script will prompt you to add or replace lines to your `.env` using your NEAR account information. All information is stored locally and is included in the `.gitignore` so that it won't show up in the Git repository. You can also pass the `--network`, `--path`, and `--help` arguments.

In addition to the account information, other environment variables you can modify are:

* `stakePerRequest` to the amount you want to stake per request. Default is 2.5 FLX (2500000000000000000)

More information about the other options coming soon..

## Running the node

### Docker

Docker and Docker Compose must be installed before running a containerized validator node. To run a light node (using the Explorer GraphQL and standard RPC):

``` Bash
docker-compose --env-file .env up
```

### Native

Node.js must be installed before running a validator node natively. After installing you can run:

```Bash
npm install
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
