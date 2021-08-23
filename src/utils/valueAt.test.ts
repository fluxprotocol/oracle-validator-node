import valueAt from "./valueAt";

describe('valueAt', () => {
    it('should be able to get an item from a object using a path', () => {
        const obj = {
            a: {
                b: {
                    c: 'hello',
                },
            },
        };

        expect(valueAt(obj, 'a.b.c')).toBe('hello');
    });

    it('should be able to get the last item of an array with the $last index', () => {
        const arr = [1, 2, 3];

        expect(valueAt(arr, '$$last')).toBe(3);
    });

    it('should be able to get the last item of an array with object using the $last index', () => {
        const arr = [{value: 1}, {value: 2}, {value: 3}];

        expect(valueAt(arr, '$$last.value')).toBe(3);
    });

    it('should be able to get the last item of an array with object that is nested using the $last index', () => {
        const arr = { values: [{ value: 1 }, { value: 2 }, { value: 3 }] };

        expect(valueAt(arr, 'values[$$last].value')).toBe(3);
    });
});
