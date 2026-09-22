import en from './locales/en.json';
import ja from './locales/ja.json';
import type { HomePageDefinition, HomePages } from '../../src/platform/home-types';

function fromLocale(home: typeof en.home): HomePageDefinition {
  return {
    mode: 'blocks',
    meta: home.meta,
    sections: [
      {
        type: 'hero',
        badge: home.hero.badge,
        title: home.hero.title,
        description: home.hero.description,
        primaryLabel: home.hero.ctaPrimary,
        secondaryLabel: home.hero.ctaSecondary,
        secondaryHref: '/guides',
        videoId: home.hero.videoId,
      },
      {
        type: 'quick-start',
        badge: home.start.badge,
        title: home.start.title,
        cards: home.start.cards,
      },
      {
        type: 'recent',
        title: home.updates.title,
        category: 'guides',
        limit: 6,
        popularBadge: home.popular.badge,
        popularTitle: home.popular.title,
        popularLinks: home.popular.quickLinks,
      },
      {
        type: 'explore',
        title: home.explore.title,
        description: home.explore.description,
        modules: home.explore.modules,
      },
      {
        type: 'cta',
        title: home.closingCta.title,
        description: home.closingCta.description,
        primaryLabel: home.closingCta.primary,
        secondaryLabel: home.closingCta.secondary,
      },
    ],
  };
}

export const homePages = {
  en: fromLocale(en.home),
  ja: fromLocale(ja.home),
} satisfies HomePages;

