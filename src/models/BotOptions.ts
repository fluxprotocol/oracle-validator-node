import { NetworkType } from "./NearNetworkConfig";

export interface BotOptions {
    net: NetworkType;
    accountId: string;
    credentialsStorePath: string;

    /** The maximum challenge round the bot wants to commit to */
    maximumChallengeRound: number;
}
