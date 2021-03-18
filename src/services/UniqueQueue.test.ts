import UniqueQueue from "./UniqueQueue";

describe('UniqueQueue', () => {
    describe('enqueue', () => {
        it('should be able to push items onto the queue', () => {
            const queue = new UniqueQueue<string, string>();

            queue.enqueue('1', 'test');

            expect(queue.queue.has('1')).toBe(true);
        });

        it('should overwrite duplicates with the latest entry', () => {
            const queue = new UniqueQueue<string, string>();

            queue.enqueue('1', 'test');
            queue.enqueue('1', 'blah');

            expect(queue.queue.size).toBe(1);
            expect(queue.queue.get('1')).toBe('blah');
        });
    });

    describe('dequeue', () => {
        it('should return nothing when nothing is in the queue', () => {
            const queue = new UniqueQueue<string, string>();
            const value = queue.dequeue();

            expect(value).toBe(null);
        });

        it('should remove the item that came last and return it', () => {
            const queue = new UniqueQueue<string, string>();

            queue.enqueue('1', 'test');
            queue.enqueue('2', 'test2');
            queue.enqueue('3', 'test3');

            const item = queue.dequeue();
            const item2 = queue.dequeue();
            const item3 = queue.dequeue();
            const notAvailable = queue.dequeue();

            expect(item).toBe('test');
            expect(item2).toBe('test2');
            expect(item3).toBe('test3');
            expect(notAvailable).toBe(null);
        });
    });
});
