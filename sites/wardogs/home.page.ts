import type { HomePages } from '../../src/platform/home-types';

const english = {
  mode: 'override',
  meta: {
    title: 'WARDOGS Field Guide | Early Access Guides, Maps & Weapons',
    description:
      'Source-checked WARDOGS Early Access guides for your first match, weapons, maps, cash and roles, plus launch updates and server help.',
  },
  sections: [
    {
      type: 'hero',
      badge: 'Early Access Field Guide',
      title: 'WARDOGS',
      description:
        'Source-checked guides for the moving objective, cash system, weapons and maps.',
      primaryLabel: 'View on Steam',
      secondaryLabel: 'Start Here',
      secondaryHref: '/wardogs-beginner-guide/',
    },
    {
      type: 'quick-start',
      badge: 'Field Manual',
      title: 'Prepare for the next match',
      cards: [
        {
          number: '01',
          title: 'Beginner Guide',
          description: 'Learn the three-team objective and the spending loop.',
          icon: 'lucide:map',
          href: '/wardogs-beginner-guide/',
        },
        {
          number: '02',
          title: 'Weapons',
          description: 'Browse 33 labelled community test-build records.',
          icon: 'lucide:crosshair',
          href: '/wardogs-weapons/',
        },
      ],
    },
    {
      type: 'recent',
      title: 'Latest Updates',
      category: 'updates',
      limit: 4,
      popularBadge: 'Player Briefings',
      popularTitle: 'Start with these guides',
      popularLinks: [
        { label: 'Beginner Guide', href: '/wardogs-beginner-guide/' },
        { label: 'Patch Notes', href: '/wardogs-patch-notes/' },
      ],
    },
    {
      type: 'cta',
      title: 'Check the current field status',
      description: 'Distinguish released changes from historical test-build notes.',
      primaryLabel: 'View on Steam',
    },
  ],
} satisfies HomePages['en'];

export const homePages = {
  en: english,
  ja: english,
} satisfies HomePages;
