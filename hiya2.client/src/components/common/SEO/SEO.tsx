import React from 'react';
import { Helmet } from 'react-helmet-async';
import { canonicalUrl, DEFAULT_IMAGE, seoConfig, toAbsoluteUrl } from '../../../seo/routeSeo';

// TODO(brand): add the 1200x630 share image at public/image/og-default.jpg. Until it exists the
// default og:image falls back to the logo (decided at build time, see vite.config.ts).

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

// Tag set must stay identical to the server-injected one (Hiya2.Server/Seo/SeoPageRenderer.cs).
export const SEO: React.FC<SEOProps> = ({ title, description, path, image, type = 'website', noindex = false }) => {
  const url = canonicalUrl(path);
  const img = toAbsoluteUrl(image || DEFAULT_IMAGE);
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={noindex ? 'noindex,follow' : 'index,follow'} />
      <meta property="og:site_name" content={seoConfig.siteName} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:locale" content={seoConfig.locale} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  );
};
