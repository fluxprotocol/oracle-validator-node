import { Argv } from "yargs";

export function credentialOptions(yargs: Argv): Argv {
    return yargs
        .option('accountId', {
            describe: 'The account id you are logged in with (near-cli login)',
            type: 'string',
            demandOption: true,
        })
        .option('credentialsStore', {
            describe: 'The folder where the private keys are store (.near-credentials)',
            type: 'string',
            demandOption: false,
            default: '~/.near-credentials/',
        });
}
