import * as path from 'node:path';

export const DEFAULT_SITE_ID = 'anvil-quest';

const requestedSiteId = process.env.SITE_ID?.trim();

// 最低安全边界：SITE_ID 会参与文件路径解析，禁止路径分隔符和上级目录。
if (requestedSiteId && !/^[a-z0-9][a-z0-9-]*$/.test(requestedSiteId)) {
  throw new Error(`Invalid SITE_ID "${requestedSiteId}". Use lowercase letters, numbers, and hyphens.`);
}

export const isPlatformBuild = Boolean(requestedSiteId);
export const activeSiteId = requestedSiteId || DEFAULT_SITE_ID;

const root = process.cwd();
export const activeSiteRoot = path.resolve(root, 'sites', activeSiteId);

export const activeSitePaths = {
  root: activeSiteRoot,
  config: path.join(activeSiteRoot, 'site.config.ts'),
  navigation: path.join(activeSiteRoot, 'navigation.ts'),
  routing: path.join(activeSiteRoot, 'routing.ts'),
  locales: path.join(activeSiteRoot, 'locales'),
  content: isPlatformBuild
    ? path.join(activeSiteRoot, 'content', 'wiki')
    : path.resolve(root, 'src', 'content', 'wiki'),
  assets: isPlatformBuild
    ? path.join(activeSiteRoot, 'assets')
    : path.resolve(root, 'src', 'assets'),
  public: path.join(activeSiteRoot, 'public'),
  themeCss: path.join(activeSiteRoot, 'theme.css'),
  generatedPublic: path.resolve(root, '.generated', activeSiteId, 'public'),
} as const;
