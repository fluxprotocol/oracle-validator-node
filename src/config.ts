import Big from 'big.js';
import dotenv from 'dotenv';

dotenv.config();

Big.PE = 100000;

export const JOB_SEARCH_INTERVAL = 1000;
export const BALANCE_REFRESH_INTERVAL = 10000;
export const CLAIM_CHECK_INTERVAL = 10000;
export const TOKEN_DENOM = 18;
