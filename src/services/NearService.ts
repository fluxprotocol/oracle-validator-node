import { Account, connect, keyStores, Near } from "near-api-js";
import { NEAR_RPC_URL } from "../config";
import { createNearNetworkConfig, NetworkType } from "../models/NearNetworkConfig";
import cache from "../utils/cache";

export async function connectToNear(net: NetworkType, credentialsStorePath: string): Promise<Near> {
    return connect({
        ...createNearNetworkConfig(net, NEAR_RPC_URL),
        deps: {
            keyStore: new keyStores.UnencryptedFileSystemKeyStore(credentialsStorePath),
        }
    });
}

export async function getAccount(connection: Near, accountId: string): Promise<Account> {
    return cache(accountId, async () => {
        return connection.account(accountId);
    });
}
