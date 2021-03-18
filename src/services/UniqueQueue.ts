export default class UniqueQueue<K, V> {
    queue: Map<K, V> = new Map();

    /**
     * Enqueue's an item on the list
     *
     * @param {K} id
     * @param {V} item
     * @memberof UniqueQueue
     */
    enqueue(id: K, item: V) {
        this.queue.set(id, item);
    }

    /**
     * Gets and removes the next item in line
     *
     * @return {(V | null)}
     * @memberof UniqueQueue
     */
    dequeue(): V | null {
        const result = this.queue.keys().next();

        if (typeof result.value === 'undefined') {
            return null;
        }

        const value = this.queue.get(result.value);
        this.queue.delete(result.value);

        return value ?? null;
    }

    get length() {
        return this.queue.size;
    }
}
