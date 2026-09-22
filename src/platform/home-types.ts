import type { Locale } from '~/i18n/routing';

export interface HomeMeta {
  title: string;
  description: string;
}

export interface HomeHeroBlock {
  type: 'hero';
  badge?: string;
  title: string;
  description: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  videoId?: string;
}

export interface HomeQuickStartCard {
  number: string;
  title: string;
  description: string;
  icon: string;
  href: string;
}

export interface HomeQuickStartBlock {
  type: 'quick-start';
  badge?: string;
  title: string;
  cards: HomeQuickStartCard[];
}

export interface HomePopularLink {
  label: string;
  href: string;
}

export interface HomeRecentBlock {
  type: 'recent';
  title: string;
  category?: string;
  limit?: number;
  popularBadge?: string;
  popularTitle?: string;
  popularLinks?: HomePopularLink[];
}

export interface HomeExploreModule {
  order: number;
  name: string;
  description: string;
  href: string;
  displayType: string;
  highlights: Array<Record<string, unknown>>;
}

export interface HomeExploreBlock {
  type: 'explore';
  title: string;
  description?: string;
  modules: HomeExploreModule[];
}

export interface HomeFaqBlock {
  type: 'faq';
  title: string;
  description?: string;
  items: Array<{ question: string; answer: string }>;
}

export interface HomeCtaBlock {
  type: 'cta';
  title: string;
  description?: string;
  primaryLabel: string;
  secondaryLabel?: string;
}

export type HomeBlock =
  | HomeHeroBlock
  | HomeQuickStartBlock
  | HomeRecentBlock
  | HomeExploreBlock
  | HomeFaqBlock
  | HomeCtaBlock;

export interface HomePageDefinition {
  mode?: 'blocks' | 'override';
  meta: HomeMeta;
  sections: HomeBlock[];
}

export type HomePages = Partial<Record<Locale, HomePageDefinition>> & {
  en: HomePageDefinition;
};

