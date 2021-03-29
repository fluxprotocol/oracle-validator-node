import PouchDB from 'pouchdb';
import PouchDbFind from 'pouchdb-find';
import { DATABASE_NAME } from '../config';
import logger from './LoggerService';

let database: PouchDB.Database;

export async function startDatabase(): Promise<PouchDB.Database> {
    if (database) return database;

    PouchDB.plugin(PouchDbFind);

    database = new PouchDB(DATABASE_NAME, {
        revs_limit: 1,
    });

    // TODO: Create indexes
    return database;
}

export async function createDocument(id: string, obj: object) {
    let doc = {
        _id: id,
    };

    await database.put(doc);
}

export async function findDocumentById<T>(id: string): Promise<T | null> {
    try {
        const doc = await database.get<T>(id);
        return doc;
    } catch (error) {
        return null;
    }
}

export async function findDocuments<T>(query: PouchDB.Find.FindRequest<T>): Promise<T[]> {
    try {
        const data = await database.find(query);
        return data.docs as unknown as T[];
    } catch (error) {
        logger.error(`[findDocuments] ${error}`);
        return [];
    }
}

export async function createOrUpdateDocument(id: string, obj: object) {
    try {
        const existingDoc = await findDocumentById<object>(id);

        if (!existingDoc) {
            await createDocument(id, obj);
            return;
        }

        const updatedDoc = {
            ...existingDoc,
            ...obj,
        };

        await database.put(updatedDoc, {
            force: true,
        });
    } catch (error) {
        logger.error(`[createOrUpdateDocument] ${error}`);
    }
}

export function listenToDatabase(onEntry: (doc: any) => void) {
    database.changes({
        since: 'now',
        live: true,
        include_docs: true,
    }).on('change', (event) => {
        onEntry(event.doc!);
    });
}
