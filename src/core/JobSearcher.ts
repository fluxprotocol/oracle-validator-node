import { Near } from "near-api-js";
import { JOB_SEARCH_INTERVAL } from "../config";
import { DataRequestViewModel } from "../models/DataRequest";

function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
}

export function listenForJobs(connection: Near, onJobsFound: (request: DataRequestViewModel[]) => void) {
    setInterval(() => {
        const max = 5;
        const request: DataRequestViewModel[] = [
            {
                id: getRandomInt(max).toString(),
                source: 'https://pokeapi.co/api/v2/pokemon/ditto',
                sourcePath: 'abilities[0].ability.name',
                outcomes: ['limber', 'forest'],
                challengeRound: 0,
            },
            {
                id: getRandomInt(max).toString(),
                source: 'https://pokeapi.co/api/v2/pokemon/ditto',
                sourcePath: 'abilities[0].ability.name',
                outcomes: ['limber', 'forest'],
                challengeRound: 0,
            },
            {
                id: getRandomInt(max).toString(),
                source: 'https://pokeapi.co/api/v2/pokemon/ditto',
                sourcePath: 'abilities[0].ability.name',
                outcomes: ['limber', 'forest'],
                challengeRound: 0,
            }
        ];

        onJobsFound(request);
    }, JOB_SEARCH_INTERVAL);
}
