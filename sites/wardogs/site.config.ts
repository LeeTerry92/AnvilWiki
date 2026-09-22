import type { SiteConfig } from '../../src/config/site';

export const site: SiteConfig = {
  theme: 'tactical',
  projectLanding: false,
  articlePathMode: 'flat',
  brandMark: 'W',
  name: 'WARDOGS Field Guide',
  shortName: 'WARDOGS',
  description:
    'An unofficial WARDOGS field guide covering Early Access gameplay, weapons, maps, updates and player support with source and version notes.',
  domain: 'www.wardogs.top',
  tagline: 'Three forces. One moving objective.',
  legalNotice:
    'Unofficial fan guide. Not affiliated with BULKHEAD or Team17.',
  contactEmail: '',
  social: {
    official: 'https://www.team17.com/games/wardogs',
  },
  sameAs: ['https://store.steampowered.com/app/1867240/WARDOGS/', 'https://www.team17.com/games/wardogs'],
  game: {
    name: 'WARDOGS',
    platform: 'Steam',
    developer: 'BULKHEAD',
    genre: 'Tactical first-person shooter',
    releaseDate: '2026-09-10',
  },
  ogImageWidth: 1200,
  ogImageHeight: 630,
  defaultAuthor: 'WARDOGS Field Guide',
};

export default site;

export const siteUrl: string = (process.env.SITE_URL || `https://${site.domain}`).replace(
  /\/$/,
  '',
);
