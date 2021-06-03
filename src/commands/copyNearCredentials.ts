import fs from 'fs';
import os from 'os';
import { Argv, CommandModule } from 'yargs';
import { truncate } from '../utils/stringUtils';

const prompt = require('prompt-sync')();

const DOTENV = `./.env`;

export const copyNearCredentials: CommandModule = {
    command: 'copy-near-credentials',
    describe: 'Copies NEAR account details from local near-cli configuration to .env',
    builder: (yargs: Argv) => yargs
        .positional('path', {
            describe: 'Optional path to the .near-credentials folder (ending with /)',
            type: 'string',
            demandOption: false,
        })
        .positional('network', {
            type: 'string',
            default: 'testnet',
            describe: 'Network of credentials to copy (e.g. mainnet, testnet)',
            demandOption: false,
        })
        .positional('account_id', {
            type: 'string',
            demandOption: true,
            describe: 'Account name (e.g. user.near)'
        })
    ,
    handler: async (args) => {
        // copy .env.example to .env if it doesn't exist
        if (!fs.existsSync(DOTENV)) {
            let envExample = "./.env.example";
            console.log(`${DOTENV} not found. Copying ${envExample}...`)
            fs.copyFileSync(envExample, DOTENV);
            console.log(`Done creating ${DOTENV}.`)
        }

        // fetch .near-credentials folder
        let prefix;
        const homedir = os.homedir();
        if (args.path) {
            prefix = args.path;
        } else if (homedir.length > 0) {
            prefix = `${homedir}/.near-credentials/`;
        } else {
            console.log(`No .near-credentials folder found. Pass explicitly with --path`)
            process.exit(1);
        }

        // fetch account id and private key
        const filePath = `${prefix}${args.network}/${args.account_id}.json`;
        let file;
        let accountId;
        let privateKey;
        try {
            file = require(filePath);
            accountId = file.account_id;
            privateKey = file.private_key;
        } catch (e) {
            console.log(`Error reading file at ${filePath}`)
            process.exit(1);
        }
        console.log(`Found account ${accountId} for network '${args.network}'.`);

        // ask to replace lines in .env
        let replaced_config_options = 0;
        console.log(`Searching for configuration options in ${DOTENV} to replace...`);

        replaced_config_options += askToReplaceEnvLines("ACCOUNT_ID", accountId);
        replaced_config_options += askToReplaceEnvLines("PRIVATE_KEY", privateKey);

        console.log(`Replaced ${replaced_config_options} configuration options. Done.`);

    }
};

// @returns 1 if newValue is added in configOption, otherwise 0
function askToReplaceEnvLines(configOption: string, newValue: string) {

    // search for configOption in .env. Ask to replace lines if they differ from newValue
    console.log(`Searching for configuration option ${configOption}...`);
    const data = fs.readFileSync(DOTENV).toString();
    const lines = data.split(/\r?\n/);

    // loop through lines in .env
    for (let i = 0; i < lines.length; i++) {
        // check if line matches config option
        if (lines[i].startsWith(configOption)) {
            // return 0 early if configOption is already set to newValue
            if (lines[i].endsWith(newValue)) {
                console.log(`${configOption} already set to ${truncate(newValue)}. Skipping.`);
                return 0;
            // otherwise, the configOption needs to be changed to the newValue
            } else {
                while (true) {
                    const res = prompt(`Found ${truncate(lines[i])} in ${DOTENV}. Overwrite value with ${truncate(newValue)}? (Y/n) `);
                    if (res === "Y") {
                        lines[i] = `${configOption}=${newValue}`;
                        fs.writeFile(DOTENV, lines.join("\n"), function(err) {
                            if (err) return console.log(err);
                        });
                        return 1;
                    } else if (res.toLowerCase() === "n" || res.toLowerCase() === "no") {
                        console.log(`Skipping.`)
                        return 0;
                    } else {
                        console.log(`Invalid answer '${res}'. Please type 'Y' or 'n'.`);
                    }
                }
            }
        }
    }

    // configOption not found in .env. Ask to append
    while (true) {
        const res = prompt(`'${configOption}' not found in ${DOTENV}. Append ${newValue}? (Y/n) `);
        if (res === "Y") {
            lines.push(`${configOption}=${newValue}`);
            fs.writeFile(DOTENV, lines.join("\n"), function(err) {
                if (err) return console.log(err);
            });
            return 1;
        } else if (res.toLowerCase() === "n" || res.toLowerCase() === "no") {
            console.log(`Skipping.`)
            return 0;
        } else {
            console.log(`Invalid answer '${res}'. Please type 'Y' or 'n'.`);
        }
    }

    return 0;
}
