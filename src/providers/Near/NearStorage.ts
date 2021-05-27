import Big from "big.js";
import BN from "bn.js";
import { Account, utils } from "near-api-js";
import { STORAGE_DEPOSIT_CHECK_INTERVAL } from "../../config";
import logger from "../../services/LoggerService";
import cache from "../../utils/cache";
import NearProviderOptions from "./NearProviderOptions";
import { TransactionOption } from "./NearService";

export async function getMinimumStorage(contractId: string, account: Account): Promise<Big> {
    try {
        const result = await cache(`${contractId}_minimum_storage_balance`, async () => {
            const minimumBalance = await account.viewFunction(contractId, 'storage_balance_bounds', {});
            return Big(minimumBalance.min);
        });

        return result;
    } catch (error) {
        console.error('[getMinimumStorage]', error);
        return new Big(0);
    }
}

export async function getStorageBalance(contractId: string, accountId: string, account: Account): Promise<{ total: Big, available: Big }> {
    try {
        const storage = await account.viewFunction(contractId, 'storage_balance_of', {
            account_id: accountId,
        });

        return {
            total: storage ? new Big(storage.total) : new Big(0),
            available: storage ? new Big(storage.available) : new Big(0),
        };
    } catch (error) {
        console.error('[getStorageBalance]', error);
        return {
            total: new Big(0),
            available: new Big(0),
        };
    }
}

/**
 * Creates a storage deposit transaction if it's required
 *
 * @export
 * @param {string} contractId
 * @param {string} accountId
 * @param {WalletConnection} walletConnection
 * @param {Big} extraStorage Can be used for calls that require way more than the minimum storage requirements
 * @return {(Promise<TransactionOption | null>)}
 */
export async function createStorageTransaction(nearOptions: NearProviderOptions, account: Account, extraStorage: Big = new Big(0)): Promise<TransactionOption | null> {
    const contractId = nearOptions.oracleContractId;
    const minimumStorageRequired = await getMinimumStorage(contractId, account);
    const storageBalance = await getStorageBalance(contractId, account.accountId, account);
    const storageRequired = minimumStorageRequired.add(extraStorage);

    logger.debug(`near: Minimum storage: ${minimumStorageRequired.toString()}, currentBalance: ${storageBalance.available.toString()}/${storageBalance.total.toString()}`);

    // Either storage is less then what's required
    // Or the available store is less then 1/4th of the requirement
    if (storageBalance.total.lt(storageRequired) || storageBalance.available.lt(storageRequired.div(4))) {
        return {
            receiverId: contractId,
            transactionOptions: [{
                amount: storageRequired.sub(storageBalance.available).toString(),
                gas: nearOptions.maxGas,
                methodName: 'storage_deposit',
                args: {
                    accountId: account.accountId,
                }
            }],
        };
    }

    return null;
}

let isCheckingStorage = false;

async function depositStorage(nearOptions: NearProviderOptions, account: Account) {
    const transaction = await createStorageTransaction(nearOptions, account);
    if (!transaction) return;

    const amount = transaction.transactionOptions[0].amount;
    const amountFormatted = utils.format.formatNearAmount(amount, 3);
    logger.info(`near: Storage running low, depositing storage with ${amountFormatted}N amount`);

    await account.functionCall(nearOptions.oracleContractId, 'storage_deposit', {
        account_id: account.accountId,
    }, new BN(nearOptions.maxGas), new BN(amount));
}

export async function startStorageDepositChecker(nearOptions: NearProviderOptions, account: Account) {
    await depositStorage(nearOptions, account);

    setInterval(async () => {
        if (isCheckingStorage) return;

        isCheckingStorage = true;
        await depositStorage(nearOptions, account);
        isCheckingStorage = false;
    }, STORAGE_DEPOSIT_CHECK_INTERVAL);
}
