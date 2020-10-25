export type UserInfo = {
    user: string,
    pass: string,
    name?: string,
    url?: string,
}

export const defaultConfig = {
    sites: [
        {
            name: 'example',
            user: 'xxx',
            pass: 'xxx',
        }
    ] as UserInfo[],
    randomTime: true,
    browser: {
        useBrowser: false, // if false, ignore the rest browser settings
        browserDir: '',
        headless: true,
    },
    signIn: false,
}
