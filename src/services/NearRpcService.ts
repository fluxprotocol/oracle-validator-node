import { Account, Near } from "near-api-js";
import { ORACLE_CONTRACT_ID } from "../config";
import cache from "../utils/cache";
import logger from "./LoggerService";

export async function getAccount(connection: Near, accountId: string): Promise<Account> {
    return cache(accountId, async () => {
        return connection.account(accountId);
    });
}

export async function getContractState(connection: Near) {
    try {
        /** @todo Seperate this so we don't fetch the same account again and again */
        const oracleAccount = await getAccount(connection, ORACLE_CONTRACT_ID);


    } catch (error) {
        logger.error(error);
    }
}
