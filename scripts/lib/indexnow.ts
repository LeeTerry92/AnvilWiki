/**
 * Shared IndexNow helpers.
 *
 * The protocol allows 8-128 characters from A-Z / a-z / 0-9 / "-".
 * Keep validation in one place so build-time key emission and submission
 * cannot silently disagree.
 */

import * as path from 'node:path';

export const INDEXNOW_KEY_RE = /^[A-Za-z0-9-]{8,128}$/;

/**
 * Load a local .env file into process.env. submit-indexnow and
 * write-indexnow-key run under tsx, which — unlike `astro build` (Vite) —
 * does NOT read .env: before this loader, the "local .env" copy of
 * INDEXNOW_KEY documented since v2.33.0 was dead config, and a local
 * submit-indexnow run silently fell back to whatever public/<key>.txt it
 * found. Existing process.env values win (CI/Actions vars are never
 * clobbered); a missing file is a no-op; a malformed file warns instead of
 * failing (the value may still arrive from the real environment).
 */
export function loadLocalEnv(filePath = '.env'): void {
  try {
    process.loadEnvFile(path.resolve(filePath));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    console.warn(
      `⚠️ Could not parse ${filePath} (${error instanceof Error ? error.message : String(error)}) — continuing with the process environment only.`,
    );
  }
}

export function normalizeIndexNowKey(raw: string | undefined | null): string | null {
  const value = raw?.trim() ?? '';
  if (!value) return null;
  if (!INDEXNOW_KEY_RE.test(value)) {
    throw new Error(
      'INDEXNOW_KEY must be 8-128 characters using only A-Z, a-z, 0-9, or "-".',
    );
  }
  return value;
}

export function indexNowKeyFileName(key: string): string {
  const normalized = normalizeIndexNowKey(key);
  if (!normalized) throw new Error('IndexNow key cannot be empty.');
  return `${normalized}.txt`;
}

export function decodeXmlEntities(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

export function extractSitemapLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) =>
    decodeXmlEntities(match[1].trim()),
  );
}

export function normalizeSiteOrigin(raw: string): string {
  const url = new URL(raw);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`SITE_URL must use http or https, got ${url.protocol}`);
  }
  return url.origin;
}

export function isAcceptedIndexNowStatus(status: number): boolean {
  return status === 200 || status === 202;
}
