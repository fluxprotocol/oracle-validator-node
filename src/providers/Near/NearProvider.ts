import Big from "big.js";
import { Account, Near } from "near-api-js";
import { ClaimError, ClaimResult, ClaimResultType } from "../../models/ClaimResult";
import DataRequest, { createMockRequest } from "../../models/DataRequest";
import { Outcome, OutcomeType } from "../../models/DataRequestOutcome";
import { NetworkType } from "../../models/NearNetworkConfig";
import { getProviderOptions, NodeOptions } from "../../models/NodeOptions";
import { Provider, StakeResponse } from "../Provider";
import { getDataRequestByIdFromNear, getDataRequestsAsCursorFromNear } from "./NearExplorerService";
import NearProviderOptions from "./NearProviderOptions";
import { connectToNear, extractLogs, getAccount } from "./NearService";
import { JOB_SEARCH_INTERVAL } from '../../config';
import { startStorageDepositChecker } from './NearStorage';

export default class NearProvider implements Provider {
    providerName = 'NEAR';
    id = 'near';
    static id = 'near';

    private nearConnection?: Near;
    private nodeAccount?: Account;
    private nearOptions?: NearProviderOptions;
    private nodeOptions?: NodeOptions;
    private currentRequestId?: string;

    validateOptions(options: NodeOptions, providerOptions: Partial<NearProviderOptions>) {
        const errors: string[] = [];

        if (!providerOptions.credentialsStorePath && !providerOptions.privateKey) {
            errors.push(`config option "credentialsStorePath" or "privateKey" is required for ${this.id}`);
        }

        if (!providerOptions.net) {
            errors.push(`config option "net" is required for ${this.id}`);
        }

        if (!providerOptions.accountId) {
            errors.push(`config option "accountId" is required for ${this.id}"`);
        }

        if (!providerOptions.oracleContractId) {
            errors.push(`config option "oracleContractId" is required for ${this.id}`);
        }

        if (!providerOptions.tokenContractId) {
            errors.push(`config option "tokenContractId" is required for ${this.id}`);
        }

        if (!providerOptions.explorerApi) {
            errors.push(`config option "explorerApi" is required for ${this.id}`);
        }

        if (!providerOptions.maxGas) {
            errors.push(`config option "maxGas" is required for ${this.id}`);
        }

        if (!providerOptions.storageBase) {
            errors.push(`config option "storageBase" is required for ${this.id}`);
        }

        return errors;
    }

    async init(options: NodeOptions) {
        const nearOptions = getProviderOptions<NearProviderOptions>(this.id, options);
        if (!nearOptions) throw new Error('Invalid config');

        this.nearOptions = nearOptions;
        this.nodeOptions = options;
        this.nearConnection = await connectToNear(nearOptions.net as NetworkType, nearOptions);
        this.nodeAccount = await getAccount(this.nearConnection, nearOptions.accountId);

        startStorageDepositChecker(nearOptions, this.nodeAccount);
    }

    async getTokenBalance(): Promise<Big> {
        try {
            if (!this.nearOptions) throw new Error('init() was not called');

            const balance: string = await this.nodeAccount!.viewFunction(this.nearOptions.tokenContractId, 'ft_balance_of', {
                account_id: this.nodeAccount!.accountId,
            });

            return new Big(balance);
        } catch (error) {
            return new Big('0');
        }
    }

    async getDataRequestById(requestId: string): Promise<DataRequest | null> {
        if (!this.nearOptions) return null;
        return getDataRequestByIdFromNear(this.nearOptions.explorerApi, requestId, this.nearOptions);
    }

    listenForRequests(onRequests: (requests: DataRequest[]) => void) {
        setInterval(async () => {
            const requests = await this.getNextRequests();
            onRequests(requests);
        }, JOB_SEARCH_INTERVAL);
    }

    async claim(requestId: string): Promise<ClaimResult> {
        const account = this.nodeAccount;

        if (!account || !this.nearOptions) {
            return {
                type: ClaimResultType.Error,
                error: ClaimError.Unknown,
            };
        }

        const result = await account.functionCall(this.nearOptions.oracleContractId, 'dr_claim', {
            request_id: requestId,
            account_id: account.accountId,
            // @ts-ignore
        }, this.nearOptions.maxGas, this.nearOptions.storageBase);

        const logs = extractLogs(result);
        const claimLog = logs.find(log => log.type === 'claims');

        return {
            received: claimLog?.params.payout ?? '0',
            type: ClaimResultType.Success
        };
    }

    async finalize(requestId: string): Promise<boolean> {
        const account = this.nodeAccount;

        if (!account || !this.nearOptions) {
            return false;
        }

        await account.functionCall(this.nearOptions.oracleContractId, 'dr_finalize', {
            request_id: requestId,
            // @ts-ignore
        }, this.nearOptions.maxGas, this.nearOptions.storageBase);

        return true;
    }

    async stake(requestId: string, outcome: Outcome, stakeAmount: string): Promise<StakeResponse> {
        const account = this.nodeAccount;
        if (!account || !this.nearOptions) {
            return {
                amountBack: new Big(0),
                success: false,
            };
        }

        // Formatting is weird in rust..
        const stakeOutcome = outcome.type === OutcomeType.Invalid ? 'Invalid' : { 'Answer': outcome.answer };

        const response = await account.functionCall(this.nearOptions.tokenContractId, 'ft_transfer_call', {
            receiver_id: this.nearOptions.oracleContractId,
            amount: stakeAmount,
            msg: JSON.stringify({
                'StakeDataRequest': {
                    id: requestId,
                    outcome: stakeOutcome,
                }
            }),
            // @ts-ignore
        }, this.nearOptions.maxGas, '1');

        const logs = extractLogs(response);
        const userStake = logs.find(log => log.type === 'user_stakes');

        if (!userStake) {
            return {
                amountBack: new Big(0),
                success: true,
            };
        }

        return {
            amountBack: new Big(stakeAmount).sub(userStake.params.total_stake),
            success: true,
        };
    }

    private async getNextRequests() {
        if (!this.nearOptions?.explorerApi) return [];

        const currentRequestId = this.currentRequestId ?? '0';
        const nextRequests = await getDataRequestsAsCursorFromNear(this.nearOptions, {
            limit: 100,
            startingRequestId: currentRequestId,
        });

        if (nextRequests.next) {
            this.currentRequestId = nextRequests.next;
        }

        return nextRequests.items;
    }

    async sync(startingRequestId: string, onRequest: (request: DataRequest) => void): Promise<void> {
        if (!this.nearOptions?.explorerApi) return Promise.reject();
        this.currentRequestId = startingRequestId;

        let hasMore = true;

        while(hasMore) {
            const requests = await this.getNextRequests();

            if (!requests.length) {
                hasMore = false;
            }

            requests.forEach((request) => {
                onRequest(request);
            });
        }
    }
}
