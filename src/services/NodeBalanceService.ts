import Big from "big.js";
import JobWalker from "../core/JobWalker";
import Database from "./DatabaseService";
import NodeBalance from "../core/NodeBalance";
import { BalanceStatus, BalanceStatusViewModel, transformToBalanceStatusViewModel } from "../models/BalanceStatus";
import { sumBig } from "../utils/bigUtils";

export function calculateBalanceStatus(nodeBalance: NodeBalance, jobWalker: JobWalker) {
    const sumBalances = sumBig(Array.from(nodeBalance.balances.values()));
    const requests = Array.from(jobWalker.requests.values());

    const stakingRequests = requests.flatMap(r => r.staking);
    const activelyStaking = stakingRequests.reduce((prev, curr) => prev.add(curr.amountStaked), new Big(0));

    return {
        profit: nodeBalance.balanceStatus.profit,
        activelyStaking,
        balance: sumBalances,
    }
}

export async function storeBalanceStatus(balanceStatus: BalanceStatusViewModel) {
    try {
        const convertedBalanceStatus: BalanceStatus = JSON.parse(JSON.stringify(balanceStatus));
        await Database.createOrUpdateDocument(balanceStatus.type, convertedBalanceStatus);
    } catch (error) {
        console.error('[storeBalance]', error);
    }
}

export async function getBalanceStatus(): Promise<BalanceStatusViewModel> {
    try {
        const balanceStatusRaw: BalanceStatus | null = await Database.findDocumentById('BalanceStatus');

        if (!balanceStatusRaw) {
            return transformToBalanceStatusViewModel({
                balance: '0',
                claimed: '0',
                staked: '0',
            });
        }

        return transformToBalanceStatusViewModel(balanceStatusRaw);
    } catch (error) {
        console.error('[getBalanceStatus]', error);

        return transformToBalanceStatusViewModel({
            balance: '0',
            claimed: '0',
            staked: '0',
        });
    }
}
