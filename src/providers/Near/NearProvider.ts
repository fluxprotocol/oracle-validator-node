import Big from "big.js";
import { Account, Near, WalletConnection, providers } from "near-api-js";
import { ClaimError, ClaimResult, ClaimResultType } from "../../models/ClaimResult";
import DataRequest from "../../models/DataRequest";
import { getRequestOutcome, isOutcomesEqual, Outcome, OutcomeType } from "../../models/DataRequestOutcome";
import { NetworkType } from "../../models/NearNetworkConfig";
import { getProviderOptions, NodeOptions } from "../../models/NodeOptions";
import { Provider, StakeResponse } from "../Provider";
import { getDataRequestByIdFromNear, getDataRequestsAsCursorFromNear } from "./NearExplorerService";
import NearProviderOptions from "./NearProviderOptions";
import { connectToNear, createNearOutcome, extractLogs, getAccount, isTransactionFailure } from "./NearService";
import { JOB_SEARCH_INTERVAL } from '../../config';
import { startStorageDepositChecker } from './NearStorage';
import { OracleConfig } from "../../models/OracleConfig";
import { BN } from "bn.js";

export default class NearProvider implements Provider {
    providerName = 'NEAR';
    id = 'near';
    static id = 'near';

    nearConnection?: Near;
    nodeAccount?: Account;
    nearOptions?: NearProviderOptions;
    currentRequestId?: string;

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
        this.nearConnection = await connectToNear(nearOptions.net as NetworkType, nearOptions);
        this.nodeAccount = await getAccount(this.nearConnection, nearOptions.accountId);

        // We fetch the latest config to make getTokenBalance() work correctly
        const config = await this.config();
        this.nearOptions.tokenContractId = config.stakingToken.contractId;

        startStorageDepositChecker(nearOptions, this.nodeAccount);
    }

    async config(): Promise<OracleConfig> {
        if (!this.nodeAccount || !this.nearOptions) {
            throw new Error('init() was not called');
        }

        const config = await this.nodeAccount.viewFunction(this.nearOptions.oracleContractId, 'get_config', {});

        return {
            stakingToken: {
                contractId: config.stake_token,
                decimals: 18,
                symbol: 'FLX',
            }
        }
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

    async claim(request: DataRequest): Promise<ClaimResult> {
        const account = this.nodeAccount;

        if (!account || !this.nearOptions) {
            return {
                type: ClaimResultType.Error,
                error: ClaimError.Unknown,
            };
        }

        const requestOutcome = getRequestOutcome(request);
        const transactions: Promise<providers.FinalExecutionOutcome>[] = [];

        // Build up any unbonded stake
        request.staking.forEach((stake) => {
            const resolutionWindow = request.resolutionWindows[stake.roundId];

            if (!resolutionWindow.bondedOutcome || !isOutcomesEqual(resolutionWindow.bondedOutcome, requestOutcome)) {
                transactions.push(
                    account.functionCall(this.nearOptions!.oracleContractId, 'dr_unstake', {
                        request_id: request.id,
                        resolution_round: stake.roundId,
                        outcome: createNearOutcome(request, requestOutcome),
                        amount: stake.amountStaked,
                    }, new BN(this.nearOptions!.maxGas), new BN('1')),
                );
            }
        });

        await Promise.all(transactions);

        const result = await account.functionCall(this.nearOptions.oracleContractId, 'dr_claim', {
            request_id: request.id,
            account_id: account.accountId,
            // @ts-ignore
        }, this.nearOptions.maxGas, this.nearOptions.storageBase);

        const logs = extractLogs(result);
        const claimLog = logs.find(log => log.type === 'claims');
        const profit = new Big(claimLog?.params.payout ?? '0');
        const correctStake = new Big(claimLog?.params.user_correct_stake ?? '0');

        return {
            received: profit.add(correctStake).toString(),
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

    async stake(request: DataRequest, outcome: Outcome, stakeAmount: string): Promise<StakeResponse> {
        const account = this.nodeAccount;
        if (!account || !this.nearOptions) {
            return {
                amountBack: new Big(0),
                success: false,
            };
        }

        // Formatting is weird in rust..
        const stakeOutcome = createNearOutcome(request, outcome);

        // TODO: Use the token contract id from the request. This could change in a config update.
        const response = await account.functionCall(this.nearOptions.tokenContractId, 'ft_transfer_call', {
            receiver_id: this.nearOptions.oracleContractId,
            amount: stakeAmount,
            msg: JSON.stringify({
                'StakeDataRequest': {
                    id: request.id,
                    outcome: stakeOutcome,
                }
            }),
            // @ts-ignore
        }, this.nearOptions.maxGas, '1');

        const isFailure = isTransactionFailure(response);

        if (isFailure) {
            return {
                success: false,
                amountBack: new Big(stakeAmount),
            };
        }

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

    async getNextRequests() {
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
