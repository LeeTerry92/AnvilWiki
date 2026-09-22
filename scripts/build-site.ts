import { spawnSync } from 'node:child_process';
import { siteBuildEnv } from './lib/site-build-env';

const siteId = process.argv[2];
if (!siteId || process.argv.length !== 3) {
  throw new Error('Usage: pnpm build:site <site-id>');
}

const env = siteBuildEnv(siteId, process.cwd(), process.env);
console.log(`[site] building ${siteId} for ${env.SITE_URL}`);
const result = spawnSync('pnpm', ['build'], { stdio: 'inherit', env });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
