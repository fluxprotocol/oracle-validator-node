import { Account, connect, keyStores, Near, providers, utils } from "near-api-js";
import path from 'path';

import { createNearNetworkConfig, NetworkType } from "../../models/NearNetworkConfig";
import cache from "../../utils/cache";
import { parseJson } from "../../utils/jsonUtils";
import NearProviderOptions from "./NearProviderOptions";

export async function connectToNear(net: NetworkType, nearOptions: NearProviderOptions): Promise<Near> {
    let keyStore: keyStores.KeyStore | undefined;

    if (nearOptions.credentialsStorePath) {
        const credentialsStorePath = path.resolve(nearOptions.credentialsStorePath) + path.sep;
        keyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsStorePath);
    } else if (nearOptions.privateKey) {
        const keyPair = utils.KeyPair.fromString(nearOptions.privateKey);
        keyStore = new keyStores.InMemoryKeyStore();
        keyStore.setKey(nearOptions.net, nearOptions.accountId, keyPair);
    }

    if (!keyStore) throw new Error('Key store could not be created due lack of private key');

    return connect({
        ...createNearNetworkConfig(net),
        deps: {
            keyStore,
        }
    });
}

export async function getAccount(connection: Near, accountId: string): Promise<Account> {
    return cache(accountId, async () => {
        return connection.account(accountId);
    });
}

export function extractLogs(executionOutcome: providers.FinalExecutionOutcome) {
    const logs: any[] = [];

    executionOutcome.receipts_outcome.forEach((receipt) => {
        receipt.outcome.logs.forEach((log) => {
            const json = parseJson(log);

            if (json) {
                logs.push(json);
            }
        });
    });

    return logs;
}
