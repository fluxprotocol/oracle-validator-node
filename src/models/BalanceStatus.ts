import Big from "big.js";

export interface BalanceStatus {
    balance: string;
    staked: string;
    claimed: string;
}

export interface BalanceStatusViewModel {
    balance: Big;
    profit: Big;
    staked: Big;
    claimed: Big;
    type: 'BalanceStatus';
}

export function transformToBalanceStatusViewModel(data: BalanceStatus): BalanceStatusViewModel {
    const claimed = new Big(data.claimed);
    const staked = new Big(data.staked);

    return {
        balance: new Big(data.balance),
        profit: claimed.sub(staked),
        claimed,
        staked,
        type: 'BalanceStatus',
    };
}
