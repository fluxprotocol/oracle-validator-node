require('dotenv').config()
import yargs from "yargs";

import { start } from "./commands/start";
import { copyNearCredentials } from "./commands/copyNearCredentials";

async function main() {
    yargs
        .strict()
        .command(start)
        .command(copyNearCredentials)
        .demandCommand()
        .showHelpOnFail(true)
        .recommendCommands()
        .argv;
}

main();
