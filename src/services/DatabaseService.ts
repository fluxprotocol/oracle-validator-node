import PouchDB from 'pouchdb';
import path from 'path';
import PouchDbFind from 'pouchdb-find';
// @ts-ignore
import PouchDbDebug from 'pouchdb-debug';
import logger from './LoggerService';

class Database {
    database?: PouchDB.Database;

    async startDatabase(dbPath: string, dbName: string) {
        if (this.database) return this.database;

        const fullDbPath = path.resolve(dbPath) + path.sep;

        PouchDB.defaults({
            prefix: fullDbPath,
        });

        PouchDB.plugin(PouchDbDebug);
        PouchDB.plugin(PouchDbFind);

        this.database = new PouchDB(dbName, {
            revs_limit: 0,
            auto_compaction: true,
            prefix: fullDbPath,
        });

        // TODO: Create indexes
        return this.database;
    }

    /**
     * Checks if the database was correctly created
     * If it was not created we exit the node
     *
     * @memberof Database
     */
    async checkDatabase() {
        try {
            await this.database?.info();
        } catch (error) {
            logger.error(`Database could not be created: ${error}`);
            process.exit(1);
        }
    }

    async createDocument(id: string, obj: object) {
        let doc = {
            _id: id,
            ...obj,
        };

        await this.database?.put(doc);
    }

    private async cleanDatabase() {
        await this.database?.viewCleanup();
        await this.database?.compact();
    }

    async deleteDocument(id: string) {
        try {
            const doc = await this.findDocumentById(id);
            //https://pouchdb.com/api.html#delete_document
            console.log('[toRemove] doc -> ', doc);
            await this.database?.remove(doc as PouchDB.Core.RemoveDocument);
            await this.cleanDatabase();
        } catch (error) {
            return;
        }
    }

    async findDocumentById<T>(id: string): Promise<T | null> {
        try {
            const doc = await this.database?.get<T>(id);
            return doc ?? null;
        } catch (error) {
            return null;
        }
    }

    async findDocuments<T>(query: PouchDB.Find.FindRequest<T>): Promise<T[]> {
        try {
            const data = await this.database?.find(query);
            return data?.docs as unknown as T[] ?? [];
        } catch (error) {
            logger.error(`[findDocuments] ${error}`);
            return [];
        }
    }

    async createOrUpdateDocument(id: string, obj: object): Promise<void> {
        try {
            const existingDoc = await this.findDocumentById<object>(id);

            if (!existingDoc) {
                await this.createDocument(id, obj);
                return;
            }

            const updatedDoc = {
                ...existingDoc,
                ...obj,
            };

            await this.database?.put(updatedDoc, {
                force: true,
            });

            await this.cleanDatabase();
        } catch (error) {
            logger.error(`[createOrUpdateDocument] ${error} -> ${id} - ${JSON.stringify(obj)}`);
        }
    }
}

const database = new Database();
export default database;
