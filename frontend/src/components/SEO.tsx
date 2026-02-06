import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  keywords?: string;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
}

export function SEO({
  title,
  description,
  path = '',
  keywords,
  type = 'website',
  noindex = false
}: SEOProps) {
  const baseUrl = 'https://eloleaderboard.de';
  const fullUrl = `${baseUrl}${path}`;
  const fullTitle = title.includes('42 Heilbronn') ? title : `${title} - 42 Heilbronn ELO Leaderboard`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
