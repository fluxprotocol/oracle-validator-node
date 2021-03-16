import at from "lodash.at";

export function isJson(str: string) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }

    return true;
}

export function pathToValue(path: string, obj: any): string {
    const parsedPath = at(obj, [path]);
    return parsedPath[0];
}
