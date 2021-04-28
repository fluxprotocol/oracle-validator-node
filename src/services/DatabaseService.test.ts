import Database from './DatabaseService';

describe('DatabaseService', () => {
    let databaseSpy: jest.SpyInstance<any>;

    describe('startDatabase', () => {
        it('should create a database with the correct path', async () => {
            const database = await Database.startDatabase('./test', 'db_test_name');
            // @ts-ignore
            const result = database.__opts;

            expect(result).toBeDefined();
            expect(result.prefix.endsWith('/test/')).toBe(true);
            expect(result.name.endsWith('/db_test_name')).toBe(true);
            expect(result.revs_limit).toBe(1);
        });
    });

    describe('createDocument', () => {
        it('should create a document', async () => {
            const put = jest.fn();
            // @ts-ignore
            Database.database = {
                put,
            };

            await Database.createDocument('test', {
                test: 'foo',
            });

            expect(put).toHaveBeenCalledTimes(1);
            expect(put).toHaveBeenCalledWith({
                _id: 'test',
                test: 'foo',
            });
        });
    });

    describe('deleteDocument', () => {
        it('should call remove with the doc', async () => {
            const remove = jest.fn();
            const get = jest.fn(async () => ({
                'id': 'test',
                'foo': 'bar',
            }));

            // @ts-ignore
            Database.database = {
                remove,
                // @ts-ignore
                get,
            }

            await Database.deleteDocument('test');

            expect(get).toHaveBeenCalledTimes(1);
            expect(get).toHaveBeenCalledWith('test');
            expect(remove).toHaveBeenCalledTimes(1);
            expect(remove).toHaveBeenCalledWith({
                'id': 'test',
                'foo': 'bar',
            });
        });
    });

    describe('findDocumentById', () => {
        it('should call get and find a doc', async () => {
            const get = jest.fn(async () => ({
                'id': 'test',
                'foo': 'bar',
            }));

            // @ts-ignore
            Database.database = {
                // @ts-ignore
                get,
            }

            const result = await Database.findDocumentById('test');

            expect(get).toHaveBeenCalledTimes(1);
            expect(get).toHaveBeenCalledWith('test');
            expect(result).toStrictEqual({
                'id': 'test',
                'foo': 'bar',
            });
        });
    });

    describe('findDocuments', () => {
        it('should call get and find a doc', async () => {
            const find = jest.fn(async () => ({
                docs: [{
                    'id': 'test',
                    'foo': 'bar',
                }]
            }));

            // @ts-ignore
            Database.database = {
                // @ts-ignore
                find,
            }

            const result = await Database.findDocuments({
                selector: {
                    id: 'test',
                }
            });

            expect(find).toHaveBeenCalledTimes(1);
            expect(find).toHaveBeenCalledWith({
                selector: {
                    id: 'test',
                }
            });

            expect(result).toStrictEqual([{
                'id': 'test',
                'foo': 'bar',
            }]);
        });
    });
})
