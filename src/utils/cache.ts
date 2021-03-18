const cacheStorage = new Map<string, any>();
const creationPromises = new Map<string, Promise<any>>();

/**
 * Caches an item by it's id and returns it if it's requested again.
 * If it does not exist it asks you to create the item
 *
 * @export
 * @template T
 * @param {string} id
 * @param {() => Promise<T>} createCallback
 * @return {Promise<T>}
 */
export default async function cache<T>(id: string, createCallback: () => Promise<T>): Promise<T> {
    const item = cacheStorage.get(id);
    if (item) return item;

    // No need to create another item when the request is already going
    // Instead we just redirect the promise back to this call
    // Caching will be handled by the iniator
    const onGoingRequest = creationPromises.get(id);
    if (onGoingRequest) return onGoingRequest;

    // Keep track of all ongoing promises
    const createRequest = createCallback();
    creationPromises.set(id, createRequest);

    try {
        const createdItem = await createRequest;
        cacheStorage.set(id, createdItem);
        return createdItem;
    } catch (error) {
        throw error;
    } finally {
        creationPromises.delete(id);
    }
}
