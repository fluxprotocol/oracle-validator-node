import Big from "big.js";
import { Account, Near } from "near-api-js";
import { TOKEN_CONTRACT_ID } from "../../config";
import { createMockRequest, DataRequestViewModel } from "../../models/DataRequest";
import { NodeOptions } from "../../models/NodeOptions";
import { DataRequestFinalizeClaimResponse, DataRequestStakeResponse, Provider } from "../Provider";
import { connectToNear, getAccount } from "./NearService";

function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
}

export default class NearProvider implements Provider {
    providerName = 'NEAR';
    id = 'near-blockchain';

    private nearConnection?: Near;
    private nodeAccount?: Account;

    async init(options: NodeOptions) {
        this.nearConnection = await connectToNear(options.net, options.credentialsStorePath);
        this.nodeAccount = await getAccount(this.nearConnection, options.accountId);
    }

    async stake(): Promise<DataRequestStakeResponse> {
        return {
            amountBack: new Big(10),
            success: true,
        };
    }

    async getTokenBalance(): Promise<Big> {
        try {
            const balance: string = await this.nodeAccount!.viewFunction(TOKEN_CONTRACT_ID, 'ft_balance_of', {
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
}
