import path from 'path';
import { LevelUp } from 'levelup';
import level from 'level';
import subleveldown from 'subleveldown';
import logger from './LoggerService';

export const TABLE_DATA_REQUESTS = 'data_requests';
export const TABLE_SYNC = 'sync';

class Database {
    database?: level.LevelDB<any, any>;

    // Tables
    tables: Map<string, LevelUp> = new Map();

    async startDatabase(dbPath: string, dbName: string): Promise<level.LevelDB<any, any>> {
        return new Promise(async (resolve, reject) => {
            const fullDbPath = path.resolve(dbPath) + path.sep + dbName;
            const db = level(fullDbPath, {}, (error) => {
                if (!error) return;
                reject(error.message);
            });

            console.log('[] fullDbPath -> ', fullDbPath);

            await db.open();

            console.log('crash');

            // Creating all tables
            this.tables.set(TABLE_DATA_REQUESTS, subleveldown(db, TABLE_DATA_REQUESTS));
            this.tables.set(TABLE_SYNC, subleveldown(db, TABLE_SYNC));

            resolve(db);
        });
    }

    private getTable(key: string) {
        const table = this.tables.get(key);
        if (!table) throw new Error('ERR_TABLE_NOT_FOUND');

        return table;
    }

    async createDocument(tableKey: string, id: string, obj: object) {
        const table = this.getTable(tableKey);
        await table.put(id, JSON.stringify(obj));
    }

    async deleteDocument(tableKey: string, id: string) {
        const table = this.getTable(tableKey);
        await table.del(id);
    }

    async findDocumentById<T>(tableKey: string, id: string): Promise<T | null> {
        try {
            const table = this.getTable(tableKey);
            const doc = await table.get(id);

            return doc ? JSON.parse(doc) : null;
        } catch (error) {
            return null;
        }
    }

    getAllFromTable<T>(tableKey: string): Promise<T[]> {
        return new Promise((resolve, reject) => {
            const table = this.getTable(tableKey);
            const docs: T[] = [];

            table.createValueStream()
                .on('data', (data) => docs.push(JSON.parse(data)))
                .on('error', (error) => reject(error))
                .on('close', () => resolve(docs))
        });
    }

    async createOrUpdateDocument(tableKey: string, id: string, obj: object): Promise<void> {
        try {
            const existingDoc = await this.findDocumentById<object>(tableKey, id);

            if (!existingDoc) {
                await this.createDocument(tableKey, id, obj);
                return;
            }

            const updatedDoc = {
                ...existingDoc,
                ...obj,
            };

            await this.createDocument(tableKey, id, updatedDoc);
        } catch (error) {
            logger.error(`[createOrUpdateDocument] ${error} -> ${id} - ${JSON.stringify(obj)}`);
        }
    }
}

const database = new Database();
export default database;
