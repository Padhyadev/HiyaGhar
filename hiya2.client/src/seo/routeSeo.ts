// Shared SEO route data. public/seo/routes.json is the single source of truth: the server
// (Hiya2.Server/Seo/SeoPageRenderer.cs) reads the published copy for its injected tags,
// 404 allow-list and sitemap, so the client and the server always emit the same meta.
import config from './routes.json';

// Set in vite.config.ts: true when public/image/og-default.jpg exists at build time
// (the server applies the same check against wwwroot).
declare const __OG_DEFAULT_IMAGE_EXISTS__: boolean;

export interface RouteMeta {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}

interface RouteEntry {
  path?: string;
  prefix?: string;
  title: string;
  description: string;
  noindex?: boolean;
}

export const seoConfig = config;

export const SITE_URL = config.siteUrl;

export const DEFAULT_IMAGE = __OG_DEFAULT_IMAGE_EXISTS__ ? config.defaultImage : config.fallbackImage;

/** Absolute URL for an image path; spaces are encoded (same rule as the server). */
export const toAbsoluteUrl = (url: string) =>
  /^https?:\/\//i.test(url) ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url.replace(/ /g, '%20')}`;

/** https://hiyaghar.com + path, lower-case, no query/hash, no trailing slash (root keeps "/"). */
export const canonicalUrl = (path: string) => {
  let clean = (path || '/').split(/[?#]/)[0].toLowerCase();
  if (!clean.startsWith('/')) clean = '/' + clean;
  if (clean.length > 1) clean = clean.replace(/\/+$/, '');
  return clean === '/' ? `${SITE_URL}/` : `${SITE_URL}${clean}`;
};

const routes = config.routes as RouteEntry[];
const prefixRoutes = config.prefixRoutes as RouteEntry[];

/**
 * Meta for a route from routes.json. `fallbackPath` covers client-only route families
 * (e.g. account tabs) that should reuse another entry's meta.
 */
export function findRouteMeta(route: string, fallbackPath?: string): RouteMeta | null {
  const lower = route.toLowerCase().split(/[?#]/)[0];
  const entry =
    routes.find((r) => r.path === lower) ||
    prefixRoutes.find((r) => r.prefix && lower.startsWith(r.prefix)) ||
    (fallbackPath ? routes.find((r) => r.path === fallbackPath) : undefined);
  if (!entry) return null;
  return { title: entry.title, description: entry.description, path: lower, noindex: !!entry.noindex };
}

/**
 * Product meta description: shortDescription, else full description, else the shared template.
 * Real text shorter than 120 chars gets the template sentence appended. Max 160 chars (word boundary).
 */
export function buildProductSeoDescription(
  name: string,
  category: string | undefined,
  shortDescription?: string | null,
  fullDescription?: string | null,
): string {
  const clean = (t?: string | null) =>
    (t || '').replace(/<!--HIYA_META[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const template = config.productDescriptionTemplate.replace('{name}', name).replace('{category}', category ? `${category} ` : '');
  let text = clean(shortDescription) || clean(fullDescription);
  text = !text ? template : text.length < 120 ? `${text} ${template}` : text;
  if (text.length <= 160) return text;
  const cut = text.slice(0, 159);
  const space = cut.lastIndexOf(' ');
  return `${cut.slice(0, space > 120 ? space : 159)}…`;
}
