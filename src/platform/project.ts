import { site } from '~/config/site';

/** Platform builds expose project marketing only on sites that opt in. */
export const landingLinkEnabled = site.projectLanding === true;

export const landingLink = {
  href: '/landing/',
  label: 'Built with AnvilWiki',
  ariaLabel: 'About the AnvilWiki template',
} as const;

export const zhLandingLink = { label: '中文 · 官网', href: '/zh/landing/' } as const;
