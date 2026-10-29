/**
 * Build a shareable app URL (HashRouter — works on static hosts without SPA rewrites).
 */
export function buildAppUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${window.location.origin}/#${normalized}`;
}
