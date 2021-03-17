import at from "lodash.at";

/**
 * Safely parse json without throwing any errors
 *
 * @export
 * @param {string} str
 * @return {(object | null)}
 */
export function parseJson(str: string): object | null {
    try {
        return JSON.parse(str);
    } catch (e) {
        return null;
    }
}

/**
 * Resolves a path and returns its data
 * Converts data to string where necassary
 *
 * @export
 * @param {string} path
 * @param {*} obj
 * @return {string | null} null when the value could not be found
 */
export function pathToValue(path: string, obj: any): string | null {
    const parsedPath: any[] = at(obj, [path]);
    const value = parsedPath[0];

    if (typeof value === 'undefined' || value === null) {
        return null;
    }

    if (typeof value === 'string') {
        return value;
    }

    // JSON objects are allowed.
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    if (typeof value === 'number') {
        return value.toString();
    }

    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }

    return value;
}
