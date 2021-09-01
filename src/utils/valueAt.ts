import at from 'lodash.at';
import toPath from 'lodash.topath';

function resolveMagicVariable(object: any, name: string): string {
    if (name === '$$last' && Array.isArray(object)) {
        return (object.length - 1).toString();
    }

    return name;
}

/**
 * Gets the value of an object with the given path
 * Also apply's magic variables
 *
 * @export
 * @param {*} object
 * @param {string} path
 * @return {*}  {*}
 */
export default function valueAt(object: any, path: string): any {
    const fullPath = toPath(path);

    let currentValue = object;

    fullPath.forEach((pathPiece) => {
        let finalPathPiece = pathPiece;

        if (pathPiece.startsWith('$$')) {
            finalPathPiece = resolveMagicVariable(currentValue, pathPiece);
        }

        currentValue = at(currentValue, [finalPathPiece])[0];
    });

    return currentValue;
}
