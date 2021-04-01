import Big from "big.js";

/**
 * Converts the smalles unit to a human readable amount
 *
 * @export
 * @param {string} amount
 * @param {number} [decimals=18]
 * @param {number} [dp=2]
 * @return {string}
 */
export function formatToken(amount: string, decimals = 18, dp = 2): string {
    const denominator = new Big(10).pow(decimals);
    return new Big(amount).div(denominator).round(dp, 0).toFixed(dp);
}

/**
 * Converts the amount to the smallest unit (default 18)
 *
 * @export
 * @param {string} amount
 * @param {number} [decimals=18]
 * @return {string}
 */
export function toToken(amount: string, decimals = 18): string {
    const denominator = new Big(10).pow(decimals);
    return new Big(amount).mul(denominator).toFixed(0);
}
