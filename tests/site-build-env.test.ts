import { dirname, join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { siteBuildEnv } from '../scripts/lib/site-build-env';
import { rewriteWranglerVars } from '../scripts/lib/apply-rewrites';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('siteBuildEnv', () => {
  test('仓库根没有自动生效的 Wrangler 配置，单站模板仍可初始化', () => {
    expect(existsSync(join(root, 'wrangler.toml'))).toBe(false);
    const template = readFileSync(join(root, 'wrangler.template.toml'), 'utf8');
    const output = rewriteWranglerVars({ domain: 'mygame.wiki' }, template);
    expect(output).toContain('SITE_URL = "https://mygame.wiki"');
    expect(output).not.toContain('FORKERS READ THIS FIRST');
  });

  test('WARDOGS 构建不会继承 Anvil 变量', () => {
    const env = siteBuildEnv('wardogs', root, {
      SITE_ID: 'anvil-quest',
      SITE_URL: 'https://anvil.wiki',
      INDEXNOW_KEY: 'old-key',
      PUBLIC_GA_ID: 'G-ANVIL',
      PUBLIC_GISCUS_REPO: 'PNGTRID/AnvilWiki',
      NODE_VERSION: '22',
    });
    expect(env.SITE_ID).toBe('wardogs');
    expect(env.SITE_URL).toBe('https://www.wardogs.top');
    expect(env.INDEXNOW_KEY).toBe('');
    expect(env.PUBLIC_GA_ID).toBe('');
    expect(env.PUBLIC_GISCUS_REPO).toBe('');
    expect(env.NODE_VERSION).toBe('22');
  });

  test('Anvil Quest 保留本站的集成变量', () => {
    const env = siteBuildEnv('anvil-quest', root, {});
    expect(env.SITE_ID).toBe('anvil-quest');
    expect(env.SITE_URL).toBe('https://anvil.wiki');
    expect(env.PUBLIC_GA_ID).toBe('G-X10CG7N6P6');
  });

  test('拒绝路径穿越形式的站点标识', () => {
    expect(() => siteBuildEnv('../wardogs', root, {})).toThrow('Invalid site ID');
  });
});
