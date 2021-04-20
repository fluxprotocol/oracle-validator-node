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
                                outcome_stakes {
                                    data_request_id
                                    id
                                    round
                                    total_stake
                                    outcome
                                }
                                round
                                user_stakes {
                                    account_id
                                    data_request_id
                                    id
                                    outcome
                                    round
                                    total_stake
                                }
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
                            outcome_stakes {
                                data_request_id
                                id
                                round
                                total_stake
                                outcome
                            }
                            round
                            user_stakes {
                                account_id
                                data_request_id
                                id
                                outcome
                                round
                                total_stake
                            }
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
