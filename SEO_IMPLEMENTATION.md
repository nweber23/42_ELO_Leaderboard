# SEO Implementation Guide

This document describes the comprehensive SEO implementation for the 42 Heilbronn ELO Leaderboard.

## Overview

A complete SEO solution has been implemented covering:
- Dynamic meta tags per page
- Open Graph and Twitter Card support
- JSON-LD structured data
- XML sitemap with automatic generation
- Robots.txt configuration
- Performance optimizations
- Server-side caching strategies

## Components Added

### 1. React Helmet Async (`react-helmet-async`)

**File:** `frontend/package.json`

Added `react-helmet-async` for managing dynamic meta tags in the React application.

```bash
# Rebuild the Docker container to install the new dependency
docker-compose up --build
```

### 2. SEO Component

**File:** `frontend/src/components/SEO.tsx`

A reusable component for managing page-specific SEO meta tags:

```tsx
<SEO
  title="Table Tennis Leaderboard"
  description="View the Table Tennis ELO leaderboard..."
  path="/leaderboard/table_tennis"
  keywords="table tennis, leaderboard, ELO"
  type="website"
  noindex={false}
/>
```

**Features:**
- Dynamic title, description, and keywords
- Canonical URL generation
- Open Graph tags (Facebook, LinkedIn)
- Twitter Card tags
- Optional noindex for private pages

### 3. Enhanced index.html

**File:** `frontend/index.html`

Updated with comprehensive default meta tags:
- Primary meta tags (title, description, keywords)
- Open Graph meta tags
- Twitter Card meta tags
- JSON-LD structured data (WebSite schema)
- Canonical URL
- Proper meta tags for crawlers

### 4. SEO on Key Pages

SEO components have been added to all major pages:

| Page | SEO Features | Indexing |
|------|-------------|----------|
| **Arena (Leaderboard)** | Dynamic sport-specific titles/descriptions | Yes |
| **Login** | Standard meta tags | No (noindex) |
| **Privacy Policy** | GDPR-focused description | Yes |
| **Terms of Service** | Legal information description | Yes |
| **Impressum** | German legal requirements | Yes |

### 5. Robots.txt

**File:** `frontend/public/robots.txt`

Configured to:
- Allow all crawlers on public pages
- Disallow private routes (`/api/`, `/admin`, `/settings`, `/matches`)
- Reference sitemap location

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /settings
Disallow: /matches

Sitemap: https://elo.42heilbronn.de/sitemap.xml
```

### 6. XML Sitemap

**File:** `frontend/public/sitemap.xml`

Static sitemap covering:
- Homepage (priority 1.0)
- Sport leaderboards (priority 0.9)
- Login page (priority 0.5)
- Legal pages (priority 0.3)

All URLs include `changefreq` and `priority` for crawler guidance.

### 7. Dynamic Sitemap Generator

**File:** `frontend/scripts/generate-sitemap.js`

Node.js script that generates a fresh sitemap during build:

```bash
# Generate sitemap manually
npm run generate-sitemap

# Automatically runs during build
npm run build
```

**Features:**
- Reads sport configuration dynamically
- Adds timestamps for `lastmod`
- Can be extended to include player profiles
- Runs automatically on production builds

**Future Extensions:**
You can enhance this script to:
- Fetch active sports from the API
- Include player profile URLs
- Generate sitemap index for large sites

### 8. Nginx Configuration

**File:** `frontend/nginx.conf`

Enhanced with SEO-friendly settings:
- Proper cache headers for `robots.txt` and `sitemap.xml`
- HTML served with revalidation headers
- Trailing slash normalization
- Aggressive static asset caching (1 year)

### 9. Vite Build Optimizations

**File:** `frontend/vite.config.ts`

Production build optimized for SEO:
- Source maps enabled for debugging
- Terser minification with console.log removal
- Manual chunking for better caching (React vendor bundle)
- Improved load performance

## JSON-LD Structured Data

The homepage includes a WebSite schema:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "42 Heilbronn ELO Leaderboard",
  "description": "Track Table Tennis and Table Football rankings...",
  "url": "https://elo.42heilbronn.de/",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://elo.42heilbronn.de/leaderboard/{search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

This helps Google understand:
- Your site structure
- Search functionality
- Organization affiliation

## Performance & Core Web Vitals

SEO-friendly performance improvements:
- Code splitting (React.lazy) reduces initial bundle size
- Manual vendor chunking improves caching
- Gzip compression enabled in Nginx
- Aggressive static asset caching
- Lazy loading of page components

## Google Search Console Setup

To monitor your SEO performance:

1. **Verify ownership** in [Google Search Console](https://search.google.com/search-console)
2. **Submit sitemap**: `https://elo.42heilbronn.de/sitemap.xml`
3. **Request indexing** for key pages
4. **Monitor** crawl errors, coverage, and performance

## Best Practices Applied

### Meta Tags
- Unique title and description per page
- Title length: 50-60 characters
- Description length: 150-160 characters
- Keywords targeting specific sports and features

### Open Graph
- Proper OG tags for social sharing
- Consistent branding across platforms
- Type specified per page (website, article, profile)

### Technical SEO
- Canonical URLs prevent duplicate content
- Robots meta tag for page-level control
- Proper HTML semantic structure
- Mobile-responsive viewport settings

### Security Headers
- HSTS enabled
- CSP configured
- X-Frame-Options set
- No mixed content

## Testing Your SEO

### 1. Google Rich Results Test
Test structured data:
```
https://search.google.com/test/rich-results
```

### 2. Meta Tags Preview
Check how your pages appear in search:
```bash
curl -s https://elo.42heilbronn.de/ | grep -E '<title>|<meta'
```

### 3. Sitemap Validation
Verify sitemap is accessible:
```bash
curl https://elo.42heilbronn.de/sitemap.xml
```

### 4. Lighthouse Audit
Run Chrome DevTools Lighthouse for SEO score:
- SEO score should be 90+
- Check for meta description, title, crawlability

### 5. Mobile-Friendly Test
```
https://search.google.com/test/mobile-friendly
```

## Analytics Integration (Optional)

To track SEO performance, consider adding:

### Google Analytics 4
```tsx
// Add to index.html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Umami (Privacy-friendly alternative)
Open-source analytics with GDPR compliance built-in.

## Monitoring & Maintenance

### Regular Tasks
- **Weekly**: Check Google Search Console for errors
- **Monthly**: Review sitemap coverage and indexing status
- **Quarterly**: Update meta descriptions based on performance
- **Yearly**: Review and update structured data schemas

### Key Metrics to Track
- Organic traffic growth
- Click-through rate (CTR) from search results
- Average position for target keywords
- Core Web Vitals scores
- Crawl errors and coverage issues

## Customization

### Adding New Sports
The sitemap generator automatically includes sports defined in `scripts/generate-sitemap.js`. Update the `sportRoutes` array:

```javascript
const sportRoutes = [
  { id: 'table_tennis', priority: 0.9, changefreq: 'daily' },
  { id: 'new_sport', priority: 0.8, changefreq: 'daily' },
];
```

### Dynamic Player Profiles
To include player profiles in sitemap:

1. Fetch player data in `generate-sitemap.js`
2. Add player URLs with priority 0.6
3. Update robots.txt to allow `/players/` route

### Social Media Images
Add Open Graph images:

```tsx
<SEO
  title="..."
  description="..."
  image="https://elo.42heilbronn.de/og-image.png"
/>
```

Update `SEO.tsx` to accept an `image` prop and add:
```tsx
<meta property="og:image" content={image} />
<meta name="twitter:image" content={image} />
```

## Troubleshooting

### Sitemap Not Found
- Verify `frontend/public/sitemap.xml` exists
- Check Nginx is serving static files correctly
- Rebuild Docker container: `docker-compose up --build`

### Meta Tags Not Updating
- Clear React Helmet cache by restarting the app
- Check browser cache (Ctrl+Shift+R)
- Verify `HelmetProvider` wraps the app in `main.tsx`

### Pages Not Indexed
- Check robots.txt isn't blocking the page
- Verify no `noindex` meta tag on the page
- Submit URL manually in Google Search Console
- Check if page is behind authentication

## Resources

- [Google Search Central](https://developers.google.com/search)
- [React Helmet Async Docs](https://github.com/staylor/react-helmet-async)
- [Schema.org Documentation](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards)

## Summary

Your ELO Leaderboard now has enterprise-grade SEO:
- ✅ Dynamic meta tags with react-helmet-async
- ✅ Open Graph and Twitter Cards
- ✅ JSON-LD structured data
- ✅ XML sitemap with auto-generation
- ✅ Robots.txt configuration
- ✅ Performance optimizations
- ✅ Proper caching headers
- ✅ Mobile-responsive and accessible

**Next Steps:**
1. Rebuild Docker container: `docker-compose up --build`
2. Verify sitemap: `https://elo.42heilbronn.de/sitemap.xml`
3. Submit to Google Search Console
4. Monitor performance with Lighthouse
5. Track organic traffic growth
