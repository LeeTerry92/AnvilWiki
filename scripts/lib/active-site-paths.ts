import * as path from 'node:path';
import { activeSitePaths, isPlatformBuild } from '../../src/platform/site-context';

const root = process.cwd();

export const scriptSitePaths = {
  content: isPlatformBuild ? activeSitePaths.content : path.resolve(root, 'src/content/wiki'),
  assets: isPlatformBuild ? activeSitePaths.assets : path.resolve(root, 'src/assets'),
  public: isPlatformBuild ? activeSitePaths.public : path.resolve(root, 'public'),
  themeCss: isPlatformBuild
    ? activeSitePaths.themeCss
    : path.resolve(root, 'src/styles/globals.css'),
  locales: isPlatformBuild ? activeSitePaths.locales : path.resolve(root, 'src/locales'),
  navigation: isPlatformBuild
    ? activeSitePaths.navigation
    : path.resolve(root, 'src/config/navigation.ts'),
  routing: isPlatformBuild
    ? activeSitePaths.routing
    : path.resolve(root, 'src/i18n/routing.ts'),
  siteConfig: isPlatformBuild
    ? activeSitePaths.config
    : path.resolve(root, 'src/config/site.ts'),
} as const;

export function displayPath(file: string): string {
  return path.relative(root, file).replace(/\\/g, '/');
}
