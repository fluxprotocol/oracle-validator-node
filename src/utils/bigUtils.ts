import Big from "big.js";

/**
 * Sorts big numbers from lowest value to largest
 *
 * @export
 * @param {Big[]} nums
 * @param {boolean} asc true = ascending, false is descending
 * @return {Big[]}
 */
export function sortBig(nums: Big[], asc: boolean = true): Big[] {
    if (asc) {
        return nums.sort((a, b) => {
            if (a.lt(b)) return -1;
            if (a.eq(b)) return 0;
            return 1;
        });
    } else {
        return nums.sort((a, b) => {
            if (a.lt(b)) return 1;
            if (a.eq(b)) return 0;
            return -1;
        });
    }
}
