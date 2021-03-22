import { Near } from "near-api-js";
import { JOB_SEARCH_INTERVAL } from "../config";
import { getDataRequests } from "../contracts/OracleContract";
import { DataRequestViewModel } from "../models/DataRequest";


export function listenForJobs(connection: Near, onJobsFound: (request: DataRequestViewModel[]) => void) {
    setInterval(async () => {
        const dataRequests = await getDataRequests(connection);

        onJobsFound(dataRequests);
    }, JOB_SEARCH_INTERVAL);
}
