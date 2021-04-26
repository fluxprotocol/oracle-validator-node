import DataRequest from "../../models/DataRequest";
import { queryGraph } from "../../services/GraphQLService";
import { NearDataRequestGraphData, transformNearDataRequestToDataRequest } from './models/NearDataRequest';
import NearProviderOptions from "./NearProviderOptions";

export async function getAllDataRequestsFromNear(apiUrl: string, providerOptions: NearProviderOptions): Promise<DataRequest[]> {
    try {
        const response = await queryGraph(apiUrl, {
            operationName: 'GetAllDataRequests',
            query: `
                query GetAllDataRequests($limit: Int, $offset: Int, $onlyArbitratorRequests: Boolean) {
                    dataRequests: getDataRequests(limit: $limit, offset: $offset, onlyArbitratorRequests: $onlyArbitratorRequests) {
                        total
                        items {
                            block_height
                            date
                            final_arbitrator_triggered
                            global_config_id
                            id
                            initial_challenge_period
                            outcomes
                            requestor
                            target_contract
                            finalized_outcome
                            sources {
                                end_point
                                source_path
                            }
                            resolution_windows {
                                block_height
                                bond_size
                                bonded_outcome
                                date
                                dr_id
                                end_time
                                id
                                round
                            }
                        }
                    }
                }
            `,
            variables: {
                limit: 1000,
                offset: 0,
                onlyArbitratorRequests: false,
            }
        });

        const data: NearDataRequestGraphData[] = response.data.dataRequests.items;
        return data.map(dr => transformNearDataRequestToDataRequest(providerOptions, dr));
    } catch (error) {
        console.error('[getAllDataRequestsFromNear]', error);

        return [];
    }
}

export async function getDataRequestByIdFromNear(apiUrl: string, id: string, providerOptions: NearProviderOptions) {
    try {
        const response = await queryGraph(apiUrl, {
            operationName: 'GetDataRequest',
            query: `
                query GetDataRequest($id: String!) {
                    dataRequest: getDataRequest(id: $id) {
                        block_height
                        date
                        final_arbitrator_triggered
                        global_config_id
                        id
                        initial_challenge_period
                        outcomes
                        requestor
                        target_contract
                        finalized_outcome
                        sources {
                            end_point
                            source_path
                        }
                        resolution_windows {
                            block_height
                            bond_size
                            bonded_outcome
                            date
                            dr_id
                            end_time
                            id
                            round
                        }
                    }
                }
            `,
            variables: {
                id
            }
        });

        const data: NearDataRequestGraphData = response.data.dataRequest;
        return transformNearDataRequestToDataRequest(providerOptions, data);
    } catch (error) {
        console.error('[getDataRequestById]', error);
        return null;
    }
}

interface GetDataRequestsAsCursorParams {
    limit: number;
    startingRequestId: string;
}

interface GetDataRequestsAsCursorResult {
    items: DataRequest[];
    next: string | null;
}

export async function getDataRequestsAsCursorFromNear(providerOptions: NearProviderOptions, params: GetDataRequestsAsCursorParams): Promise<GetDataRequestsAsCursorResult> {
    try {
        const response = await queryGraph(providerOptions.explorerApi, {
            operationName: 'GetDataRequestsCursored',
            query: `
                query GetDataRequestsCursored($limit: Int, $cursor: String) {
                    dataRequests: getDataRequestsAsCursor(cursor: $cursor, limit: $limit) {
                        next
                        items {
                            id
                            sources {
                                end_point
                                source_path
                            }
                            outcomes
                            finalized_outcome
                            final_arbitrator_triggered
                            resolution_windows {
                                round
                                end_time
                                bonded_outcome
                            }
                        }
                    }
                }
            `,
            variables: {
                limit: params.limit,
                cursor: params.startingRequestId,
            }
        });

        const data: NearDataRequestGraphData[] = response.data.dataRequests.items;

        return {
            items: data.map(dr => transformNearDataRequestToDataRequest(providerOptions, dr)),
            next: response.data.dataRequests.next,
        };
    } catch (error) {
        console.error('[getDataRequestsAsCursor]', error);

        return {
            items: [],
            next: null,
        };
    }
}
