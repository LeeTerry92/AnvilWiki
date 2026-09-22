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
