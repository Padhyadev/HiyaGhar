import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://hiyaghar.com';
// TODO(brand): add the 1200x630 share image at public/image/og-default.jpg (file not in the repo yet).
const DEFAULT_IMAGE = '/image/og-default.jpg';

interface SEOProps {
  title: string;
  description: string;
  /** Site-relative path, e.g. "/mukhwas". Query string and trailing slash are stripped. */
  path: string;
  /** Site-relative or absolute image URL. */
  image?: string;
  type?: 'website' | 'product';
  noindex?: boolean;
}

const toAbsolute = (url: string) => (/^https?:\/\//i.test(url) ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${encodeURI(url)}`);

const canonicalUrl = (path: string) => {
  let clean = (path || '/').split(/[?#]/)[0].toLowerCase();
  if (!clean.startsWith('/')) clean = '/' + clean;
  if (clean.length > 1) clean = clean.replace(/\/+$/, '');
  return clean === '/' ? `${SITE_URL}/` : `${SITE_URL}${clean}`;
};

export const SEO: React.FC<SEOProps> = ({ title, description, path, image, type = 'website', noindex = false }) => {
  const url = canonicalUrl(path);
  const img = toAbsolute(image || DEFAULT_IMAGE);
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={noindex ? 'noindex,follow' : 'index,follow'} />
      <meta property="og:site_name" content="HIYAGHAR" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:locale" content="en_IN" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  );
};
