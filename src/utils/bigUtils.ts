import Big from "big.js";

export function sumBig(bigNums: Big[]): Big {
    return bigNums.reduce((prev, curr) => prev.add(curr), new Big(0));
}
