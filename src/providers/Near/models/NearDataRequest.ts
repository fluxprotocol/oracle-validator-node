import DataRequest from "../../../models/DataRequest";
import { NearResolutionWindowGraphData } from "./NearResolutionWindow";
import NearProviderOptions from '../NearProviderOptions';
import NearProvider from "../NearProvider";
import { transformToOutcome } from "../../../models/DataRequestOutcome";
import { nsToMs } from "../../../utils/dateUtils";

export interface NearDataRequestGraphData {
    id: string;
    block_height: string;
    settlement_time: string;
    date: string;
    final_arbitrator_triggered: boolean;
    global_config_id: string;
    initial_challenge_period: string;
    outcomes: string[];
    requestor: string;
    target_contract: string;
    finalized_outcome: string | null;
    sources: {
        end_point: string;
        source_path: string;
    }[];
    resolution_windows: NearResolutionWindowGraphData[];
}

export function transformNearDataRequestToDataRequest(providerOptions: NearProviderOptions, data: NearDataRequestGraphData): DataRequest {
    return new DataRequest({
        contractId: providerOptions.oracleContractId,
        executeResults: [],
        id: data.id,
        providerId: NearProvider.id,
        settlementTime: new Date(nsToMs(Number(data.settlement_time))),
        outcomes: data.outcomes,
        sources: data.sources,
        staking: [],
        resolutionWindows: data.resolution_windows.map(rw => {
            return {
                bondSize: rw.bond_size,
                endTime: new Date(Number(rw.end_time) / 1000000),
                round: rw.round,
                bondedOutcome: rw.bonded_outcome ? transformToOutcome(rw.bonded_outcome) : undefined,
            }
        }),
        finalArbitratorTriggered: data.final_arbitrator_triggered,
        finalizedOutcome: data.finalized_outcome ? transformToOutcome(data.finalized_outcome) : undefined,
    });
}
