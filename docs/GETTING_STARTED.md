## Installation

The validator node requires you to have node.js installed. After installing you can run:

```Bash
npm install
```

After this you need to login with your near credentials using:

```Bash
npm install -g near-cli
near login
```

## Configuration

Copy the `config.example.json` and name it `config.json` and change the following options:

* `stakePerRequest` to the amount you want to stake per request. Default is 2.5 FLX (2500000000000000000)
* `credentialsStorePath` to the path where your `.near-credentials` are stored. Must be the full path (Usually it's located in your home directory)
* `accountId` to the account id you previously logged in with (using `near login`)

More information about the other options can you find here: LINK_TO_CONFIG_OPTIONS

## Running the node

```Bash
npm start
```

If everything went correctly you should see something like the following:

```
2021-04-28 10:30:37 info: 🤖 Starting oracle node v1.0.0 for NEAR..
2021-04-28 10:30:37 info: 🛠 Staking per request 2.50 FLX
2021-04-28 10:30:37 info: 🛠 Listening to all contracts
2021-04-28 10:30:37 info: 🔄 Syncing for near starting from request id 0
2021-04-28 10:30:59 info: ✅ Syncing completed for near
2021-04-28 10:30:37 info: 💸 Balance: 1440800.53 FLX, Staking: 0.00 FLX, Profit: 0.00 FLX, Jobs actively watching: 0
```

It can take some time for syncing to complete. Once it's finished it will start looking for jobs and execute them.
