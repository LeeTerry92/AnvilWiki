import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseEnv } from 'node:util';
import { parse } from 'smol-toml';

export function siteBuildEnv(
  siteId: string,
  root: string,
  ambient: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(siteId)) {
    throw new Error(`Invalid site ID: ${siteId}`);
  }

  const file = path.join(root, 'sites', siteId, 'wrangler.toml');
  const config = parse(fs.readFileSync(file, 'utf8'));
  const vars = config.vars;
  if (!vars || typeof vars !== 'object' || Array.isArray(vars) || vars instanceof Date) {
    throw new Error(`${file} must contain a [vars] table`);
  }
  if (vars.SITE_ID !== siteId || typeof vars.SITE_URL !== 'string') {
    throw new Error(`${file} must set SITE_ID=${siteId} and SITE_URL`);
  }
  const url = new URL(vars.SITE_URL);
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`${file} SITE_URL must be an HTTPS origin`);
  }

  const env = { ...ambient };
  for (const key of Object.keys(env)) {
    if (
      key === 'SITE_ID' ||
      key === 'SITE_URL' ||
      key === 'INDEXNOW_KEY' ||
      key.startsWith('PUBLIC_')
    ) {
      delete env[key];
    }
  }
  const knownKeys = parseEnv(fs.readFileSync(path.join(root, '.env.example'), 'utf8'));
  for (const key of Object.keys(knownKeys)) {
    if (key === 'INDEXNOW_KEY' || key.startsWith('PUBLIC_')) env[key] = '';
  }
  env.INDEXNOW_KEY = '';
  for (const [key, value] of Object.entries(vars)) {
    if (
      typeof value !== 'string' ||
      !/^(SITE_ID|SITE_URL|INDEXNOW_KEY|PUBLIC_[A-Z0-9_]+)$/.test(key)
    ) {
      throw new Error(`${file} has unsupported [vars] entry: ${key}`);
    }
    env[key] = value;
  }
  return env;
}
