import fetch from 'node-fetch';

export async function queryGraph(graphUrl: string, params: {
    query: string,
    variables?: {
        [key: string]: any,
    },
    operationName?: string,
}): Promise<any> {
    const response = await fetch(graphUrl, {
        method: 'POST',
        body: JSON.stringify(params),
        headers: {
            'Content-Type': 'application/json',
        }
    });

    return response.json();
}
