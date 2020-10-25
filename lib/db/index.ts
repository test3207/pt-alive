import sqlite3 from 'sqlite3';
import path from 'path';

export type DB = {
    raw:sqlite3.Database,
    query:(query:string, params?: any) => Promise<any[]>,
};
let db:DB|undefined;

export const initDb = async () => {
    if (db) {
        return db;
    }
    return await new Promise<DB>((resolve, reject) => {
        const dbFileDir = path.resolve(__dirname, 'sqlite');
        const raw = new (sqlite3.verbose()).Database(dbFileDir);
        raw.on('open', async () => {
            const query = async (query:string, params?: any) => {
                try {
                    return await new Promise<any[]>((resolveSQL, rejectSQL) => {  
                        raw.all(query, params || [], (err:Error|null, rows:any[]) => {
                            if (err) {
                                rejectSQL(err);
                            } else {
                                resolveSQL(rows);
                            }
                        })
                    })
                } catch (e) {
                    console.log(`db error`, e);
                    throw e;
                }
            }
            try {
                const [pt_alive_info] = await query(`select * from pt_alive;`);
                console.info(`detected pt_alive version: ${pt_alive_info.version}.`);
            } catch (e) {
                console.info(`DB initing for first time...`);
                await query(`drop table if exists pt_alive;`);
                await query(`create table if not exists pt_alive (
                    version text
                );`);
                await query(`insert into pt_alive (version) values ('0.0.1');`);
                await query(`create table if not exists cookie (
                    id integer primary key,
                    name text not null,
                    cookie text
                );`);
                await query(`create unique index if not exists cookie_name ON cookie (name);`);
                console.info(`DB inited.`);
            }
            db = {
                raw,
                query,
            }
            resolve(db);
        }).on('error', (e) => {
            if (!e.message.includes('pt_alive')) {
                console.error(e);
            }
            reject(e);
        })
    })
}
