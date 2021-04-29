import Big from "big.js";
import JobWalker from "../core/JobWalker";
import NodeBalance from "../core/NodeBalance";
import { sumBig } from "../utils/bigUtils";

export function calculateBalanceStatus(nodeBalance: NodeBalance, jobWalker: JobWalker) {
    const sumBalances = sumBig(Array.from(nodeBalance.balances.values()));
    const requests = Array.from(jobWalker.requests.values());

    const stakingRequests = requests.flatMap(r => r.staking);
    const amountStaked = stakingRequests.reduce((prev, curr) => prev.add(curr.amountStaked), new Big(0));

    const profit = sumBalances.add(amountStaked).sub(nodeBalance.startingBalance);

    return {
        profit,
        amountStaked,
        balance: sumBalances,
    }
}
