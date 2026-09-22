import type { NavigationItem } from '../../src/config/navigation';

export const NAVIGATION_CONFIG: NavigationItem[] = [
  { key: 'guides', path: '/guides', icon: 'lucide:book-open', isContentType: true, order: 1 },
  { key: 'weapons', path: '/weapons', icon: 'lucide:crosshair', isContentType: true, order: 2 },
  { key: 'maps', path: '/maps', icon: 'lucide:map', isContentType: true, order: 3 },
  { key: 'updates', path: '/updates', icon: 'lucide:radio', isContentType: true, order: 4 },
];

export const CONTENT_TYPES: string[] = NAVIGATION_CONFIG.map((item) => item.key);
