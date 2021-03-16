import { connect, keyStores, Near } from "near-api-js";
import { createNearNetworkConfig, NetworkType } from "../models/NearNetworkConfig";

export async function connectToNear(net: NetworkType, credentialsStorePath: string): Promise<Near> {
    return connect({
        ...createNearNetworkConfig(net),
        deps: {
            keyStore: new keyStores.UnencryptedFileSystemKeyStore(credentialsStorePath),
        }
    });
}

export async function connectAccount(near: Near, accountId: string) {
    return near.account(accountId);
}
