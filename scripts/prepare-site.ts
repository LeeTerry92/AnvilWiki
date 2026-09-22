import * as fs from 'node:fs';
import * as path from 'node:path';
import { activeSiteId, activeSitePaths, isPlatformBuild } from '../src/platform/site-context';

if (!isPlatformBuild) {
  console.log('[site] legacy single-site mode (SITE_ID is not set)');
  process.exit(0);
}

for (const required of [
  activeSitePaths.config,
  activeSitePaths.navigation,
  activeSitePaths.routing,
  activeSitePaths.locales,
  activeSitePaths.content,
  activeSitePaths.themeCss,
]) {
  if (!fs.existsSync(required)) {
    throw new Error(`[site] ${activeSiteId} is missing required path: ${path.relative(process.cwd(), required)}`);
  }
}

for (const asset of [
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
]) {
  if (!fs.existsSync(path.join(activeSitePaths.public, asset))) {
    throw new Error(`[site] ${activeSiteId} is missing its own public/${asset}`);
  }
}

// 启用广告变量时，单元页面必须来自本站目录，不使用根 public/ 兜底。
for (const [key, value] of Object.entries(process.env)) {
  const prefix = 'PUBLIC_ADSTERRA_SLOT_';
  if (!key.startsWith(prefix) || !value) continue;
  const unit = key.slice(prefix.length).toLowerCase().replace(/_/g, '-');
  if (!fs.existsSync(path.join(activeSitePaths.public, 'ads', `${unit}.html`))) {
    throw new Error(`[site] ${activeSiteId} enables ${key} but is missing its own public/ads/${unit}.html`);
  }
}

const generatedRoot = path.dirname(activeSitePaths.generatedPublic);
fs.rmSync(generatedRoot, { recursive: true, force: true });
fs.mkdirSync(activeSitePaths.generatedPublic, { recursive: true });

// 平台模式只共享基础响应头。验证文件、广告单元、图标和品牌素材必须
// 由站点 public 明确提供，避免一个站点的所有权或广告配置泄漏到另一站。
const sharedHeaders = path.resolve('public', '_headers');
if (fs.existsSync(sharedHeaders)) {
  fs.copyFileSync(sharedHeaders, path.join(activeSitePaths.generatedPublic, '_headers'));
}
if (fs.existsSync(activeSitePaths.public)) {
  fs.cpSync(activeSitePaths.public, activeSitePaths.generatedPublic, { recursive: true });
}
fs.copyFileSync(activeSitePaths.themeCss, path.join(activeSitePaths.generatedPublic, 'theme.css'));

console.log(
  `[site] prepared ${activeSiteId}: ${path.relative(process.cwd(), activeSitePaths.generatedPublic)}`,
);
