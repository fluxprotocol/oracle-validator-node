export interface Token {
    decimals: number;
    symbol: string;
    contractId: string;
}

export interface OracleConfig {
    stakingToken: Token;
}
