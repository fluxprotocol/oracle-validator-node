// Connect with the NEAR api
// Connect with the RPC (through the near-api-js)
// Use that to talk to the smart contract
// Check if we can listen to logs and act on those

import yargs from "yargs";
import dotenv from 'dotenv';

import { start } from "./commands/start";

async function main() {
    dotenv.config();

    yargs
        .strict()
        .command(start)
        .demandCommand()
        .showHelpOnFail(true)
        .recommendCommands()
        .argv;
}

main();
