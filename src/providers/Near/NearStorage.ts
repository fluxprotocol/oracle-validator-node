import { Account } from "near-api-js";
import NearProviderOptions from "./NearProviderOptions";

async function checkCurrentStorage(nearOptions: NearProviderOptions, account: Account) {
    const storage = await account.viewFunction(nearOptions.oracleContractId, 'storage_balance_of', {
        account_id: account.accountId,
    });

    console.log('[] storage -> ', storage);
}

export async function startStorageDepositChecker(nearOptions: NearProviderOptions, account: Account) {
    await checkCurrentStorage(nearOptions, account);

    // Do some stuff here that when storage is lower than 0.5 N re-add 1 N
}
