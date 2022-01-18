import Big from 'big.js';
import NearProvider from '@fluxprotocol/oracle-provider-near';
import { config } from 'dotenv';
import HttpModule from './modules/http/NodeHttp';
import AnalyticsLoggerModule from './modules/analytic-logs/AnalyticsLoggerModule';

config();

Big.PE = 100_000;

export const JOB_WALKER_INTERVAL = 5_000;
export const TOKEN_DENOM = 18;

// Amount of times the same data request gets executed to check if the API is valid
// Higher means it's more certain that an outcome will stay the same
export const EXECUTE_AMOUNT = 3;
// The time between each execution on the same request (in ms)
export const EXECUTE_INTERVAL = 300;

// The delay between a retry before declaring it fully invalid
export const INVALID_EXECUTION_RETRY_DELAY = 60_000;

// Whether or not we stake on requests that are already on going when we join the network
// Increases the risk of getting slashed
export const STAKE_ON_OLD_REQUESTS = process.env.STAKE_ON_OLD_REQUESTS === 'true' ?? false;

export const MAX_LOG_LIFETIME: string | undefined = process.env.MAX_LOG_LIFETIME ?? '14d';

export const DB_PATH = process.env.DB_PATH ?? './';
export const DB_NAME = process.env.DB_NAME ?? 'flux_db';
export const DEBUG = process.env.DEBUG === 'true';
export const ACTIVATED_PROVIDERS = process.env.ACTIVATED_PROVIDERS?.split(',') ?? [];

export const HTTP_PORT = Number(process.env.HTTP_PORT ?? 28484);
export const VM_ENV_KEY = 'VM_ENV_';

export const AVAILABLE_PROVIDERS = [NearProvider];
export const MODULES = [HttpModule, AnalyticsLoggerModule];
export const ENABLE_ANALYTICS = process.env.ENABLE_ANALYTICS ? process.env.ENABLE_ANALYTICS === 'true' : true;
export const SENTRY_DSN = 'https://11d1b41001d74754a68943018d26eba3@o1104820.ingest.sentry.io/6154477';

export const ENV_VARS = {
    ...process.env,
    DB_PATH,
    DB_NAME,
};
