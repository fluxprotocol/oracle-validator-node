import Big from "big.js";
import { Account, Near } from "near-api-js";
import { createMockRequest, DataRequestViewModel } from "../../models/DataRequest";
import { NetworkType } from "../../models/NearNetworkConfig";
import { getProviderOptions, NodeOptions } from "../../models/NodeOptions";
import { DataRequestFinalizeClaimResponse, Provider, StakeResponse } from "../Provider";
import { connectToNear, getAccount } from "./NearService";

function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
}

interface NodeProviderOptions {
    credentialsStorePath: string;
    net: string;
    accountId: string;
    oracleContractId: string;
    tokenContractId: string;
}

export default class NearProvider implements Provider {
    providerName = 'NEAR';
    id = 'near';
    static id = 'near';

    private nearConnection?: Near;
    private nodeAccount?: Account;
    private nearOptions?: NodeProviderOptions;

    validateOptions(options: NodeOptions, providerOptions: Partial<NodeProviderOptions>) {
        const errors: string[] = [];

        if (!providerOptions.credentialsStorePath) {
            errors.push(`config option "credentialsStorePath" is required for ${this.id}`);
        }

        if (!providerOptions.net) {
            errors.push(`config option "net" is required for ${this.id}`);
        }

        if (!providerOptions.accountId) {
            errors.push(`config option "accountId" is required for ${this.id}`);
        }

        if (!providerOptions.oracleContractId) {
            errors.push(`config option "oracleContractId" is required for ${this.id}`);
        }

        if (!providerOptions.tokenContractId) {
            errors.push(`config option "tokenContractId" is required for ${this.id}`);
        }

        return errors;
    }

    async init(options: NodeOptions) {
        const nearOptions = getProviderOptions<NodeProviderOptions>(this.id, options);
        if (!nearOptions) throw new Error('Invalid config');

        this.nearOptions = nearOptions;
        this.nearConnection = await connectToNear(nearOptions.net as NetworkType, nearOptions.credentialsStorePath);
        this.nodeAccount = await getAccount(this.nearConnection, nearOptions.accountId);
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

    async getDataRequestById(requestId: string) {
        return createMockRequest({
            id: requestId,
            source: 'ads',
            sourcePath: 'dsa',
            fees: new Big(0),
            rounds: [
                {
                    outcomeStakes: new Map(),
                    quoromDate: new Date(),
                    round: 0,
                }
            ],
        });
    }

    async getDataRequests(): Promise<DataRequestViewModel[]> {
        const max = 25;
        const request: DataRequestViewModel[] = [
            createMockRequest({
                id: getRandomInt(max).toString(),
                source: 'https://pokeapi.co/api/v2/pokemon/ditto',
                sourcePath: 'abilities[0].ability.name',
                outcomes: ['limber', 'forest'],
                contractId: 'tralala.near',
                fees: new Big(0),
                rounds: [
                    {
                        outcomeStakes: new Map(),
                        quoromDate: new Date(),
                        round: 0,
                    }
                ],
            }),
            createMockRequest({
                id: getRandomInt(max).toString(),
                source: 'https://jsonplaceholder.typicode.com/todos/1',
                sourcePath: 'completed',
                outcomes: ['false', 'true'],
                fees: new Big(0),
                rounds: [
                    {
                        outcomeStakes: new Map(),
                        quoromDate: new Date(),
                        round: 0,
                    }
                ],
            }),
            createMockRequest({
                id: getRandomInt(max).toString(),
                source: 'https://api.coingecko.com/api/v3/coins/near?localization=false',
                sourcePath: 'id',
                fees: new Big(0),
                rounds: [
                    {
                        outcomeStakes: new Map(),
                        quoromDate: new Date(),
                        round: 0,
                    }
                ],
            }),
        ];

        return request;
    }

    async claim(requestId: string): Promise<DataRequestFinalizeClaimResponse> {
        return {
            received: '1000000000000000000',
        };
    }

    async stake(): Promise<StakeResponse> {
        return {
            amountBack: new Big(10),
            success: true,
        };
    }

    async challenge(): Promise<StakeResponse> {
        return {
            amountBack: new Big(10),
            success: true,
        }
    }
}
