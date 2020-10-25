import { config } from './config';
import cron from 'node-cron';
import { RequestCenter } from './lib/request';
import { initDb } from './lib/db';

const sleep = async (seconds?: number) => {
    await new Promise((resolve, _) => {
        setTimeout(() => {
            resolve();
        }, (seconds || Math.random() * 3600) * 1000);
    })
}

const main = async () => {
    const db = await initDb();
    const req = new RequestCenter({db});

    const { sites, randomTime, signIn } = config;
    for (const site of sites) {
        cron.schedule('* * 10 * * *', async () => {
            if (randomTime) {
                await sleep();
            }
            await req.index(site);
            // if (signIn) {
            //     try {
            //         await req.signin(site);
            //     } catch (e) {
            //         console.error(`signin failed! ${site.name}`)
            //     }
            // }
        });
    }
}

main();
