import { DB } from '../db';

export class CookieCenter {
    private db:DB;
    constructor (spec:{db:DB}) {
        this.db = spec.db;
    }
    async get(name:string) {
        let cookie = ''
        const res = await this.db.query(`select cookie from cookie where name = ?;`, [name]);
        try {
            cookie = res[0].cookie;
        } catch (e) {}
        return cookie;
    }
    async set(name:string, cookie:string) {
        return await this.db.query(`insert into cookie (name, cookie) values (?, ?) on conflict(name)
        do update set cookie=?;`, [name, cookie, cookie]);
    }
};
