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

describe('站点静态资源', () => {
  test('两个站点各自拥有完整且不同的 logo 和 favicon', () => {
    const assets = [
      'logo.svg',
      'favicon.svg',
      'favicon.ico',
      'favicon-16x16.png',
      'favicon-32x32.png',
      'apple-touch-icon.png',
      'android-chrome-192x192.png',
      'android-chrome-512x512.png',
      'manifest.json',
      'images/hero.webp',
    ];
    for (const siteId of ['anvil-quest', 'wardogs']) {
      for (const asset of assets) {
        expect(existsSync(join(root, 'sites', siteId, 'public', asset))).toBe(true);
      }
    }
    for (const asset of ['logo.svg', 'favicon.svg', 'favicon.ico', 'android-chrome-512x512.png']) {
      const anvil = readFileSync(join(root, 'sites/anvil-quest/public', asset));
      const wardogs = readFileSync(join(root, 'sites/wardogs/public', asset));
      expect(wardogs.equals(anvil), `${asset} should use the WARDOGS brand`).toBe(false);
    }
  });

  test('Anvil 广告文件只由 Anvil 配置引用，WARDOGS 未启用广告', () => {
    const anvil = siteBuildEnv('anvil-quest', root, {});
    const wardogs = siteBuildEnv('wardogs', root, {});
    const adVars = Object.entries(anvil).filter(
      ([key, value]) => key.startsWith('PUBLIC_ADSTERRA_SLOT_') && value,
    );
    expect(adVars).toHaveLength(6);
    for (const [key] of adVars) {
      const unit = key.slice('PUBLIC_ADSTERRA_SLOT_'.length).toLowerCase().replace(/_/g, '-');
      expect(existsSync(join(root, 'sites/anvil-quest/public/ads', `${unit}.html`))).toBe(true);
      expect(wardogs[key]).toBe('');
    }
    expect(existsSync(join(root, 'sites/wardogs/public/ads'))).toBe(false);
  });

  test('WARDOGS 的 PWA 品牌与站点配置一致', () => {
    const manifest = JSON.parse(
      readFileSync(join(root, 'sites/wardogs/public/manifest.json'), 'utf8'),
    ) as { name: string; short_name: string; theme_color: string };
    expect(manifest.name).toBe('WARDOGS Field Guide');
    expect(manifest.short_name).toBe('WARDOGS');
    expect(manifest.theme_color).toBe('#288654');
  });
});
