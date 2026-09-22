const LANDING_PATH_RE = /^\/(?:zh\/)?landing(?:\/|$)/;
const LANDING_ENTRY_RE = /(?:^|\/)src\/pages\/(?:landing(?:\.astro|\/)|zh\/landing(?:\.astro|\/))/;

export function isProjectLandingPath(pathname: string): boolean {
  return LANDING_PATH_RE.test(pathname);
}

export function isProjectLandingEntrypoint(entrypoint: string): boolean {
  return LANDING_ENTRY_RE.test(entrypoint.replace(/\\/g, '/'));
}
