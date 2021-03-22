import Big from "big.js";
import { NetworkType } from "./NearNetworkConfig";

export interface NodeOptions {
    net: NetworkType;
    accountId: string;
    credentialsStorePath: string;

    /** The maximum challenge round the node wants to commit to */
    maximumChallengeRound: number;

    /** The maximum amount the node is allowed to stake per a request */
    stakePerRequest: Big;
}
