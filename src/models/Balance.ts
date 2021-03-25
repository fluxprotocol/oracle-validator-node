import Big from "big.js";

export interface Balance {
    balance: string;
    staking: string;
    type: 'Balance';
}

export interface BalanceViewModel {
    balance: Big;
    staking: Big;
}

export function transformToBalanceViewModel(data: Balance): BalanceViewModel {
    return {
        balance: new Big(data.balance),
        staking: new Big(data.staking),
    };
}
