import { Account, connect, keyStores, Near, providers, utils, WalletConnection, transactions } from "near-api-js";
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

export interface TransactionViewOptions {
    methodName: string;
    args?: object;
}

export interface TransactionCallOptions extends TransactionViewOptions {
    gas: string;
    amount: string;
}

export interface TransactionOption {
    receiverId: string;
    transactionOptions: TransactionCallOptions[];
}

export async function batchSendTransactions(walletConnection: WalletConnection, txs: TransactionOption[], callbackUrl?: string) {
    const accountId = walletConnection.getAccountId();
    const localKey = await walletConnection._near.connection.signer.getPublicKey(accountId, walletConnection._near.connection.networkId);
    const block = await walletConnection._near.connection.provider.block({ finality: 'final' });
    const blockHash = utils.serialize.base_decode(block.header.hash);

    const resultTxs = await Promise.all(txs.map(async ({ receiverId, transactionOptions }, index) => {
        // @ts-ignore
        const actions = transactionOptions.map(tx => transactions.functionCall(tx.methodName, tx.args ?? {}, tx.gas, tx.amount));
        const accessKey = await walletConnection.account().accessKeyForTransaction(receiverId, actions, localKey);

        if (!accessKey) {
            throw new Error(`Cannot find matching key for transaction sent to ${receiverId}`);
        }

        const publicKey = utils.PublicKey.from(accessKey.public_key);
        const nonce = accessKey.access_key.nonce + index + 1;

        return transactions.createTransaction(accountId, publicKey, receiverId, nonce, actions, blockHash);
    }));

    return walletConnection.requestSignTransactions(resultTxs, callbackUrl);
}
