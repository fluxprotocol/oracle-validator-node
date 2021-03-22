import Big from "big.js";
import { Near } from "near-api-js";
import { ORACLE_CONTRACT_ID } from "../config";
import { createMockRequest, DataRequestViewModel } from "../models/DataRequest";
import { getAccount } from "../services/NearService";

interface DataRequestStakeResponse {
    amountBack: string;
    success: boolean;
}

export async function dataRequestStake(connection: Near): Promise<DataRequestStakeResponse> {
    const oracleAccount = await getAccount(connection, ORACLE_CONTRACT_ID);

    return {
        success: true,
        amountBack: '1000000000000000000'
    };
}

interface DataRequestFinalizeClaimResponse {
    received: string;
}

export async function dataRequestFinalizeClaim(connection: Near, request: DataRequestViewModel): Promise<DataRequestFinalizeClaimResponse> {
    const oracleAccount = await getAccount(connection, ORACLE_CONTRACT_ID);

    return {
        received: '1000000000000000000',
    }
}

export async function getDataRequestById(connection: Near, dataRequestId: string): Promise<DataRequestViewModel> {
    const oracleAccount = await getAccount(connection, ORACLE_CONTRACT_ID);

    return createMockRequest({
        id: dataRequestId,
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

function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
}

export async function getDataRequests(connection: Near): Promise<DataRequestViewModel[]> {
    const oracleAccount = await getAccount(connection, ORACLE_CONTRACT_ID);
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

