const defaultIndex = '/index.php';
const defaultLogin = '/login.php';
const defaultTakeLogin = '/takelogin.php';
const defaultSignIn = '/attendance.php';
const defaultCaptcha = '/image.php?action=regimage&imagehash=$HASH';
const matchList:{
    name:string,
    url:string,
    index?:string,
    login?:string,
    takeLogin?: string,
    signIn?:string,
    captcha?:string|false,
}[] = [
    {
        name: 'lhd',
        url: 'https://leaguehd.com',
    },
    {
        name: 'hda',
        url: 'https://www.hdarea.co',
        captcha: false,
    },
]

export type SiteInfo = {
    indexUrl:string,
    loginUrl:string,
    takeLoginUrl: string,
    captchaUrl:string,
    signInUrl?:string,
    hasCaptcha?:boolean,
}

type Sites = {
    [siteNameOrUrl:string]:SiteInfo,
};

const sites:Sites = {};

for (const siteInfo of matchList) {
    sites[siteInfo.name] = sites[siteInfo.url] = {
        indexUrl: new URL(siteInfo.index || defaultIndex, siteInfo.url).href,
        loginUrl: new URL(siteInfo.login || defaultLogin, siteInfo.url).href,
        takeLoginUrl: new URL(siteInfo.takeLogin || defaultTakeLogin, siteInfo.url).href,
        captchaUrl: new URL(siteInfo.captcha || defaultCaptcha, siteInfo.url).href,
        signInUrl: new URL(siteInfo.signIn || defaultSignIn, siteInfo.url).href,
        hasCaptcha: siteInfo.captcha !== false,
    }
}

export default sites;
