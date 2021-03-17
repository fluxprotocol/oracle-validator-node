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

        it('should return an object stringified when the value is an object', () => {
            const result = pathToValue('a[0].b', {
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

            expect(result).toBe('{"c":"good"}');
        });

        it('should return an array stringified when the value is an array', () => {
            const result = pathToValue('a[1].b', {
                a: [{
                    b: {
                        c: 'good'
                    }
                }, {
                    b: [
                        1,
                        2,
                        3,
                        4,
                    ],
                }],
            });

            expect(result).toBe('[1,2,3,4]');
        });

        it('should return an number stringified when the value is an number', () => {
            const result = pathToValue('a[1].b', {
                a: [{
                    b: {
                        c: 'good'
                    }
                }, {
                    b: 2,
                }],
            });

            expect(result).toBe('2');
        });

        it('should return an stringified boolean when the value is an boolean', () => {
            const obj = {
                a: [{
                    b: {
                        c: 'good'
                    }
                }, {
                    b: false,
                    c: true,
                }],
            };

            const result = pathToValue('a[1].b', obj);
            expect(result).toBe('false');

            const result2 = pathToValue('a[1].c', obj);
            expect(result2).toBe('true');
        });

        it('should be able to handle an array as root', () => {
            const obj = [{
                a: 'test123'
            }];

            const result = pathToValue('[0].a', obj);
            expect(result).toBe('test123');
        });

        it('should return null when the property does not exists', () => {
            const obj = [{
                a: 'test123'
            }];

            const result = pathToValue('[1].a', obj);
            expect(result).toBe(null);
        });
    });
});
