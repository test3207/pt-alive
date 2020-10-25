import http from 'http';
import https from 'https';
import { CookieCenter } from '../cookie';
import { DB } from '../db';
import sites from '../sites';
import FormData from 'form-data';
import { Ptcr } from 'ptcr';
import fs from 'fs';

type Site = {
    user:string,
    pass:string,
    name?:string,
    url?:string,
}

const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36',
    'cache-control': 'no-cache',
}

// const timeout = 5000;

const request = async (targetUrl:string, headers = defaultHeaders, method='GET', formData?:any) => {
    const protocol = (new URL(targetUrl)).protocol;
    return await new Promise<{
        data: Buffer,
        cookie: string,
    }>((resolve, reject) => {
        try {
            let form:FormData|undefined;
            if (formData) {
                form = new FormData();
                for (const key in formData) {
                    form.append(key, formData[key]);
                }
            }
            const temp = (protocol === 'http:' ? http : https).request(targetUrl, {
                method,
                headers: form ? Object.assign({}, headers, form.getHeaders()) : headers,
            }, (oauthRes) => {
                console.log(targetUrl, oauthRes.headers);
                method === 'POST' && console.log(oauthRes.statusCode);
                const cookie = oauthRes.headers.cookie || '' + (oauthRes.headers["set-cookie"] || []).map((i) => {
                    return i.split(';')[0] ? i.split(';')[0] + ';' : '';
                }).join(' ');
                const chunkList:any[] = [];
                oauthRes.on('error', (e) => {
                    reject(e);
                });
                oauthRes.on('data', (chunk) => {
                    chunkList.push(chunk);
                });
                oauthRes.on('end', () => {
                    resolve({
                        data: Buffer.concat(chunkList),
                        cookie,
                    });
                });
            }).on('error', (e) => {
                reject(e);
            })
            if (form) {
                form.pipe(temp);
            } else {
                temp.end();
            }
        } catch (e) {
            reject(e);
        }
    });
};

export class RequestCenter {
    private cookie: CookieCenter;
    private ptcr: Ptcr;
    constructor(spec: {db: DB}) {
        this.cookie = new CookieCenter({db: spec.db});
        this.ptcr = new Ptcr();
    }
    async index (site: Site) {
        if (!site.name) {
            return;
        }
        const siteCookie = await this.cookie.get(site.name);
        if (!siteCookie) {
            console.log(`no cookie found, start login process`);
            return await this.login(site);
        }
        const siteInfo = sites[site.name || site.url || ''];
        if (!siteInfo) {
            throw new Error('unknow site');
        }
        const {
            data: indexPage,
            cookie
        } = await request(siteInfo.indexUrl, Object.assign({}, defaultHeaders, {
            'Cookie': siteCookie, 
        }));
        console.log('visit success');
        console.log(indexPage.toString(), cookie);
    }

    async login (site: Site) {
        if (!site.name && !site.url) {
            throw new Error('name or url are required!')
        }
        const siteInfo = sites[site.name || site.url || ''];
        if (!siteInfo) {
            throw new Error('unknow site');
        }
        console.log(`login process start with site: ${siteInfo.loginUrl}`);
        const {
            data: loginPage,
            cookie
        } = await request(siteInfo.loginUrl);
        let loginInfo = {
            username: site.user,
            password: site.pass,
            steptwocode: '',
        }
        if (siteInfo.hasCaptcha) {
            console.log(`retreive login page with site: ${site.name} with cookie: ${cookie}`);
            let imagehash = ''
            try {
                imagehash = loginPage.toString().match(/imagehash=[0-9a-z]+/)![0].slice(10);
            } catch (e) {
                console.log(e, loginPage.toString());
                fs.writeFileSync('./temp/log', loginPage);
            }
            console.log(`image hash: ${imagehash}`);
            const imgUrl = siteInfo.captchaUrl.replace('$HASH', imagehash);
            console.log(`retreiving image ${imgUrl}`);
            const {
                data: imageBuffer,
            } = await request(imgUrl, Object.assign({}, defaultHeaders, {
                cookie,
            }));
            console.log(`retreive done`);
            const imagestring = await this.ptcr.run(imageBuffer);
            console.log(`recognized image ${imagestring}`);
            loginInfo = Object.assign(loginInfo, {
                imagestring,
                imagehash,
            })
        }
        const {
            data: takeLoginPage,
            cookie: loginCookie,
        } = await request(siteInfo.takeLoginUrl, Object.assign({}, defaultHeaders, {
            cookie,
        }), 'POST', loginInfo)
        await this.cookie.set(site.name!, loginCookie);
        await this.index(site);
    }

    async signin (site: Site) {
        if (!site.name) {
            return;
        }
        const siteCookie = await this.cookie.get(site.name);
        if (!siteCookie) {
            console.log(`no cookie found, start login process`);
            return await this.login(site);
        }
        const siteInfo = sites[site.name || site.url || ''];
        if (!siteInfo) {
            throw new Error('unknow site');
        }
        if (!siteInfo.signInUrl) {
            return;
        }
        const {
            data: indexPage,
            cookie
        } = await request(siteInfo.signInUrl, Object.assign({}, defaultHeaders, {
            'Cookie': siteCookie, 
        }));
        console.log('signin success');
        console.log(indexPage.toString(), cookie);
    }
}
