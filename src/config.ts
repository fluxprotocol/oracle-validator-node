import Big from 'big.js';
import dotenv from 'dotenv';
import logger from "./services/LoggerService";

dotenv.config();

Big.PE = 100000;

export const JOB_SEARCH_INTERVAL = 1000;
export const BALANCE_REFRESH_INTERVAL = 10000;
export const CLAIM_CHECK_INTERVAL = 10000;
export const NEAR_RPC_URL = process.env.NEAR_RPC_URL ?? '';
export const ORACLE_CONTRACT_ID = process.env.ORACLE_CONTRACT_ID ?? '';
export const TOKEN_CONTRACT_ID = process.env.TOKEN_CONTRACT_ID ?? '';
export const TOKEN_DENOM = 18;

export function validateConfig() {
    if (!NEAR_RPC_URL) {
        logger.error('No NEAR_RPC_URL found in .env file');
        process.exit(1);
    } else if (!ORACLE_CONTRACT_ID) {
        logger.error('No ORACLE_CONTRACT_ID found in .env file');
        process.exit(1);
    } else if (!TOKEN_CONTRACT_ID) {
        logger.error('No TOKEN_CONTRACT_ID found in .env file');
        process.exit(1);
    }
}
