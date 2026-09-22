/** Homepage configuration, FAQ locale data, and UI type-safety contracts. */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import en from '~/locales/en.json';
import { getHomeFaq } from '~/i18n/ui';
import {
  isProjectLandingEntrypoint,
  isProjectLandingPath,
} from '~/platform/project-landing';
import { homePages } from '../sites/anvil-quest/home.page';
import { site as wardogsSite } from '../sites/wardogs/site.config';
import weapons from '../sites/wardogs/data/weapons.json';
import bakurani from '../sites/wardogs/data/bakurani-locations.json';
import ozeti from '../sites/wardogs/data/ozeti-locations.json';
import zestafona from '../sites/wardogs/data/zestafona-locations.json';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const blockRenderer = readFileSync(join(root, 'src/components/home/BlockRenderer.astro'), 'utf8');
const faqPages = [
  'src/pages/faq.astro',
  'src/pages/[locale]/faq.astro',
].map((rel) => ({ rel, src: readFileSync(join(root, rel), 'utf8') }));

const homeJson = en.home as unknown as Record<string, unknown>;

/** Walk a dotted path ("start.cards") through the en.json home object. */
function lookup(path: string): unknown {
  let cur: unknown = homeJson;
  for (const seg of path.split('.')) {
    if (cur === null || typeof cur !== 'object' || !(seg in (cur as Record<string, unknown>))) {
      return undefined;
    }
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

describe('site homepage block contract', () => {
  test('default site provides localized page metadata and sections', () => {
    for (const locale of ['en', 'ja'] as const) {
      expect(homePages[locale].meta.title.length).toBeGreaterThan(0);
      expect(homePages[locale].meta.description.length).toBeGreaterThan(20);
      expect(homePages[locale].sections.length).toBeGreaterThanOrEqual(4);
    }
  });

  test('every configured block type is wired into BlockRenderer', () => {
    const configuredTypes = new Set(
      Object.values(homePages).flatMap((page) => page.sections.map((section) => section.type)),
    );
    expect(blockRenderer).toContain('export const blockRegistry');
    for (const type of configuredTypes) {
      expect(blockRenderer, `missing blockRegistry entry for ${type}`).toMatch(
        new RegExp(`["']?${type}["']?\\s*:`),
      );
    }
  });
});

describe('WARDOGS 内容快照契约', () => {
  test('公开专题与结构化数据保持完整，且使用原站根路径', () => {
    const content = join(root, 'sites/wardogs/content/wiki/en');
    const files = ['guides', 'weapons', 'maps', 'updates'].flatMap((category) =>
      readdirSync(join(content, category)).filter((file) => file.endsWith('.mdx')),
    );
    expect(files).toHaveLength(29);
    expect(files).toContain('wardogs-weapons.mdx');
    expect(files).not.toContain('first-deployment.mdx');
    expect(files).not.toContain('supply-codes.mdx');
    expect(weapons).toHaveLength(33);
    expect(bakurani.length + ozeti.length + zestafona.length).toBe(171);
    expect(wardogsSite.articlePathMode).toBe('flat');
  });
});

describe('project landing isolation contract', () => {
  test('matches only AnvilWiki project landing URLs', () => {
    expect(isProjectLandingPath('/landing/')).toBe(true);
    expect(isProjectLandingPath('/landing/docs/first-article/')).toBe(true);
    expect(isProjectLandingPath('/zh/landing/')).toBe(true);
    expect(isProjectLandingPath('/guides/landing-zone/')).toBe(false);
    expect(isProjectLandingPath('/ja/landing/')).toBe(false);
  });

  test('matches the corresponding Astro page entrypoints on every platform', () => {
    expect(isProjectLandingEntrypoint('src/pages/landing.astro')).toBe(true);
    expect(isProjectLandingEntrypoint('/repo/src/pages/landing/docs/[slug].astro')).toBe(true);
    expect(isProjectLandingEntrypoint('C:\\repo\\src\\pages\\zh\\landing.astro')).toBe(true);
    expect(isProjectLandingEntrypoint('/repo/src/pages/index.astro')).toBe(false);
  });
});

describe('/faq pages ↔ en.json home.faq contract', () => {
  test('home.faq exists with the shape both /faq routes render', () => {
    expect(homeJson.faq).toBeDefined();
    expect(lookup('faq.title')).toBeTypeOf('string');
    expect(lookup('faq.description')).toBeTypeOf('string');
    expect(Array.isArray(lookup('faq.items'))).toBe(true);
  });

  test('every faq.<key> access on both /faq routes exists under en.json home.faq', () => {
    const offenders: string[] = [];
    for (const { rel, src } of faqPages) {
      // Strip comments first — doc blocks mention "src/pages/faq.astro", a
      // filename, not a property access on the faq namespace.
      const codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      for (const m of codeOnly.matchAll(/\bfaq\.([A-Za-z_]\w*)/g)) {
        if (lookup(`faq.${m[1]}`) === undefined) offenders.push(`${rel}: faq.${m[1]}`);
      }
    }
    expect(offenders, `missing keys:\n${offenders.join('\n')}`).toEqual([]);
  });

  test('getHomeFaq() serves the en.json namespace (and deep-merges partial locales)', () => {
    expect(getHomeFaq('en')).toEqual(en.home.faq);
    // ja.json carries its own faq; if a key were dropped there, getUi()'s
    // deep-merge must transparently fall back to en (never undefined).
    const jaFaq = getHomeFaq('ja');
    expect(jaFaq.title).toBeTypeOf('string');
    expect(jaFaq.title.length).toBeGreaterThan(0);
    expect(Array.isArray(jaFaq.items)).toBe(true);
  });
});

describe('src/ type-escape hatch ban', () => {
  /**
   * Every UI JSON surface is typed end-to-end (getUi returns `typeof en`;
   * dynamic-key loops use `keyof typeof` narrowing), so the double-hop cast
   * that used to paper over key drift has no legitimate remaining use. This
   * is the same "ban the pattern, not the symptom" move as the is:inline
   * ES2018 syntax gate: reintroducing `as unknown as` fails here instead of
   * re-hiding a key rename until a user's screen goes blank.
   */
  test('no double-hop casts anywhere in src/ (zero tolerance, comments stripped)', () => {
    const offenders: string[] = [];
    let scanned = 0;
    const scan = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) {
          scan(p);
          continue;
        }
        if (!/\.(astro|ts)$/.test(e.name)) continue;
        scanned += 1;
        // Same comment-stripping as the /faq scan above: a doc block may
        // legitimately discuss the pattern without committing it.
        const codeOnly = readFileSync(p, 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/^\s*\/\/.*$/gm, '');
        if (codeOnly.includes('as unknown as')) offenders.push(p.replace(root, ''));
      }
    };
    scan(join(root, 'src'));
    // Guard against silent regex/file-walk rot: src/ has ~60 .astro/.ts
    // files; if the walk stops seeing them the ban reads as vacuously green.
    expect(scanned).toBeGreaterThan(40);
    expect(
      offenders,
      `double-hop casts reintroduced in:\n${offenders.join('\n')}\n` +
        `Use the structured JSON types (getUi → typeof en / SharedUi) or ` +
        `'keyof typeof' narrowing instead.`,
    ).toEqual([]);
  });
});
