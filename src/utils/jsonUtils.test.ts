import { pathToValue } from './jsonUtils';

describe('jsonUtils', () => {
    describe('pathToValue', () => {
        it('should get the correct value using a stringified path', () => {
            const result = pathToValue('a.b.c', {
                a: {
                    b: {
                        c: 'good'
                    }
                }
            });

            expect(result).toBe('good');
        });

        it('should get the correct value using a stringified path containing array indexes', () => {
            const result = pathToValue('a[0].b.c', {
                a: [{
                    b: {
                        c: 'good'
                    }
                }, {
                    b: {
                        c: 'bad'
                    }
                }],
            });

            expect(result).toBe('good');
        });
    });
});
