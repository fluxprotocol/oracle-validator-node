import Big from 'big.js';
import NearProvider from '@fluxprotocol/oracle-provider-near';
import { config } from 'dotenv';

config();

Big.PE = 100_000;

export const JOB_SEARCH_INTERVAL = 5_000;
export const BALANCE_REFRESH_INTERVAL = 10_000;
export const CLAIM_CHECK_INTERVAL = 10_000;
export const STORAGE_DEPOSIT_CHECK_INTERVAL = 100_000;
export const JOB_WALKER_INTERVAL = JOB_SEARCH_INTERVAL;
export const TOKEN_DENOM = 18;

export const DB_PATH = process.env.DB_PATH ?? './';
export const DB_NAME = process.env.DB_NAME ?? 'flux_db';
export const DEBUG = process.env.DEBUG === 'true';
export const ACTIVATED_PROVIDERS = process.env.ACTIVATED_PROVIDERS?.split(',') ?? [];

export const HTTP_PORT = Number(process.env.HTTP_PORT ?? 28484);

export const AVAILABLE_PROVIDERS = [NearProvider];

export const ENV_VARS = {
    ...process.env,
    DB_PATH,
    DB_NAME,
};
