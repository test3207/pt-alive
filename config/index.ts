import { defaultConfig } from './config.default';
import { userConfig } from './config.dev';

export const config = {
    sites: defaultConfig.sites.concat(userConfig.sites || []),
    randomTime: userConfig.randomTime !== undefined ? userConfig.randomTime : defaultConfig.randomTime,
    browser: userConfig.browser !== undefined ? userConfig.browser : defaultConfig.browser,
    signIn: userConfig.signIn !== undefined ? userConfig.signIn : defaultConfig.signIn,
}
