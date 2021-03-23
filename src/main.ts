import yargs from "yargs";

import { start } from "./commands/start";

async function main() {
    yargs
        .strict()
        .command(start)
        .demandCommand()
        .showHelpOnFail(true)
        .recommendCommands()
        .argv;
}

main();
