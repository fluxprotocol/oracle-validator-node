import { Account, connect, keyStores, Near, providers } from "near-api-js";
import { createNearNetworkConfig, NetworkType } from "../../models/NearNetworkConfig";
import cache from "../../utils/cache";
import { parseJson } from "../../utils/jsonUtils";

export async function connectToNear(net: NetworkType, credentialsStorePath: string): Promise<Near> {
    return connect({
        ...createNearNetworkConfig(net),
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
