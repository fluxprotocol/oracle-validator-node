import Big from "big.js";
import { Account } from "near-api-js";
import { TOKEN_CONTRACT_ID } from "../config";

export async function getTokenBalance(account: Account): Promise<Big> {
    try {
        const balance: string = await account.viewFunction(TOKEN_CONTRACT_ID, 'ft_balance_of', {
            account_id: account.accountId,
        });

        return new Big(balance);
    } catch (error) {
        return new Big('0');
    }
}
