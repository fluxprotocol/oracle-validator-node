import { DataRequestViewModel } from "../models/DataRequest";

/**
 * Sorts data requests based on their fees (descending)
 *
 * @export
 * @param {DataRequestViewModel[]} requests
 * @return {DataRequestViewModel[]}
 */
export function sortDataRequestOnFees(requests: DataRequestViewModel[]): DataRequestViewModel[] {
    return requests.sort((a, b) => {
        if (a.fees.lt(b.fees)) return 1;
        if (a.fees.eq(b.fees)) return 0;
        return -1;
    });
}
