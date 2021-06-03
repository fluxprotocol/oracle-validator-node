const os = require("os");
const fs = require('fs');
const prompt = require('prompt-sync')();

const DOTENV = `./.env`;

require('yargs')
    .scriptName("copy-near-credentials")
    .usage('$0 <cmd> [args]')
    .command('copy-near-credentials [path] [network] [account_id]', 'copy .near-credientials to .env', (yargs) => {
        yargs.positional('path', {
            type: 'string',
            describe: 'optional path to the .near-credientials folder (ending with /)'
        })
        yargs.positional('network', {
            type: 'string',
            default: 'testnet',
            describe: 'network of credientials to copy (e.g. mainnet, testnet)'
        })
        yargs.positional('account_id', {
            type: 'string',
            demandOption: true,
            describe: 'account name (e.g. user.near)'
        })
    }, function (argv) {

        // copy .env if it doesn't exist
        if (!fs.existsSync(DOTENV)) {
            envExample = "./.env.example";
            console.log(`${DOTENV} not found. Copying ${envExample}...`)
            fs.copyFileSync(envExample, DOTENV);
            console.log(`Done creating ${DOTENV}.`)
        }

        // fetch .near-credentials folder
        let prefix;
        let homedir = os.homedir();
        if (argv.path) {
            prefix = argv.path;
        } else if (homedir.length > 0) {
            prefix = `${homedir}/.near-credentials/`;
        } else {
            console.log(`No .near-credentials folder found. Pass explicitly with --path`)
            process.exit(1);
        }

        // fetch account id and private key
        let filePath = `${prefix}${argv.network}/${argv.account_id}.json`;
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
        console.log(`Found account ${accountId} for network '${argv.network}'.`);

        // ask to replace lines in .env
        let replaced_config_options = 0;
        console.log(`Searching for configuration options in ${DOTENV} to replace...`);

        replaced_config_options += askToReplaceEnvLines("ACCOUNT_ID", accountId);
        replaced_config_options += askToReplaceEnvLines("PRIVATE_KEY", privateKey);

        console.log(`Replaced ${replaced_config_options} configuration options. Done.`);

    })
    .help()
    .argv;

// @returns 1 if newValue is added in configOption, otherwise 0
function askToReplaceEnvLines(configOption, newValue) {

    // search for configOption in .env. Ask to replace lines if they differ from newValue
    console.log(`Searching for configuration option ${configOption}...`);
    const data = fs.readFileSync(DOTENV, 'UTF-8');
    const lines = data.split(/\r?\n/);

    // loop through lines in .env
    for (let i = 0; i < lines.length; i++) {
        // check if line matches config option
        if (lines[i].startsWith(configOption)) {
            // return 0 early if configOption is already set to newValue
            if (lines[i].endsWith(newValue)) {
                console.log(`${configOption} already set to ${truncate(newValue, 15, 5, 25)}. Skipping.`);
                return 0;
            // otherwise, the configOption needs to be changed to the newValue
            } else {
                while (true) {
                    let res = prompt(`Found ${truncate(lines[i], 15, 5, 25)} in ${DOTENV}. Overwrite value with ${truncate(newValue, 15, 5, 25)}? (Y/n) `);
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
        let res = prompt(`'${configOption}' not found in ${DOTENV}. Append ${newValue}? (Y/n) `);
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

function truncate(text, startChars, endChars, maxLength) {
    if (text.length > maxLength) {
        var start = text.substring(0, startChars);
        var end = text.substring(text.length - endChars, text.length);
        return start + '...' + end;
    }
    return text;
}
