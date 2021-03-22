import Big from "big.js";
import { NetworkType } from "./NearNetworkConfig";

export interface BotOptions {
    net: NetworkType;
    accountId: string;
    credentialsStorePath: string;

    /** The maximum challenge round the bot wants to commit to */
    maximumChallengeRound: number;

    /** The maximum amount the bot is allowed to stake per a request */
    stakePerRequest: Big;
}
