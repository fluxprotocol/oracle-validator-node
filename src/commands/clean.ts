import { CommandModule } from "yargs";

export const clean: CommandModule = {
    command: 'clean',
    describe: 'Cleans the database of unused data',
    handler: async (args) => {

    },
};
