# SEO Implementation Checklist

Use this checklist to verify your SEO implementation is working correctly.

## Pre-Deployment Checklist

### Files Created/Modified
- [ ] `frontend/package.json` - Added `react-helmet-async` dependency
- [ ] `frontend/src/components/SEO.tsx` - New SEO component created
- [ ] `frontend/src/main.tsx` - Wrapped with HelmetProvider
- [ ] `frontend/index.html` - Enhanced with meta tags and JSON-LD
- [ ] `frontend/public/robots.txt` - Created
- [ ] `frontend/public/sitemap.xml` - Created
- [ ] `frontend/scripts/generate-sitemap.js` - Sitemap generator created
- [ ] `frontend/vite.config.ts` - Build optimizations added
- [ ] `frontend/nginx.conf` - SEO-friendly headers added
- [ ] Pages updated with SEO component:
  - [ ] Arena.tsx (Leaderboard)
  - [ ] Login.tsx
  - [ ] Privacy.tsx
  - [ ] Terms.tsx
  - [ ] Impressum.tsx

## Build & Deploy

### 1. Install Dependencies
```bash
cd frontend
npm install
# Or rebuild Docker container
docker-compose up --build
```

**Verify:**
- [ ] `react-helmet-async` appears in `node_modules`
- [ ] No installation errors

### 2. Generate Sitemap
```bash
npm run generate-sitemap
```

**Verify:**
- [ ] `frontend/public/sitemap.xml` was created/updated
- [ ] Sitemap includes all sport leaderboards
- [ ] No errors in console

### 3. Build for Production
```bash
npm run build
```

**Verify:**
- [ ] Build completes without errors
- [ ] Sitemap generation runs automatically
- [ ] `dist` folder contains `robots.txt` and `sitemap.xml`

### 4. Preview Build
```bash
npm run preview
```

**Verify:**
- [ ] App loads correctly
- [ ] Meta tags appear in HTML source (View Page Source)
- [ ] No console errors

## Post-Deployment Testing

### Page Load Tests

Visit each page and verify meta tags in browser DevTools (Elements tab):

#### Homepage / Leaderboard (`/` or `/leaderboard/table_tennis`)
- [ ] Title: "Table Tennis Leaderboard - 42 Heilbronn ELO Leaderboard"
- [ ] Meta description present and accurate
- [ ] Open Graph tags present (`og:title`, `og:description`, `og:url`)
- [ ] Twitter Card tags present (`twitter:title`, `twitter:description`)
- [ ] Canonical URL: `https://elo.42heilbronn.de/leaderboard/table_tennis`

#### Login Page (`/login`)
- [ ] Title: "Sign In - 42 Heilbronn ELO Leaderboard"
- [ ] Meta robots: `noindex, nofollow`
- [ ] Meta description present

#### Privacy Page (`/privacy`)
- [ ] Title: "Privacy Policy - 42 Heilbronn ELO Leaderboard"
- [ ] Meta description mentions GDPR
- [ ] Canonical URL correct

#### Terms Page (`/terms`)
- [ ] Title: "Terms of Service - 42 Heilbronn ELO Leaderboard"
- [ ] Meta description present

#### Impressum Page (`/impressum`)
- [ ] Title: "Imprint - 42 Heilbronn ELO Leaderboard"
- [ ] Meta description mentions German law

### Static File Tests

#### Robots.txt
```bash
curl https://elo.42heilbronn.de/robots.txt
```
- [ ] File loads successfully (HTTP 200)
- [ ] Contains `User-agent: *`
- [ ] Contains `Sitemap:` directive
- [ ] Disallows `/api/`, `/admin`, `/settings`, `/matches`

#### Sitemap.xml
```bash
curl https://elo.42heilbronn.de/sitemap.xml
```
- [ ] File loads successfully (HTTP 200)
- [ ] Valid XML format
- [ ] Contains all sport leaderboard URLs
- [ ] Contains legal page URLs
- [ ] Each URL has `priority` and `changefreq`

### Structured Data Test

#### Google Rich Results Test
1. Go to: https://search.google.com/test/rich-results
2. Enter: `https://elo.42heilbronn.de/`

- [ ] No errors found
- [ ] WebSite schema detected
- [ ] SearchAction present

#### Manual Check
View page source on homepage:
- [ ] `<script type="application/ld+json">` present
- [ ] Valid JSON structure
- [ ] `@type: "WebSite"` present

### Performance Tests

#### Lighthouse Audit
1. Open Chrome DevTools
2. Navigate to Lighthouse tab
3. Run audit (select SEO category)

**Target Scores:**
- [ ] SEO Score: 90+ (aim for 100)
- [ ] Performance Score: 80+
- [ ] Accessibility Score: 90+
- [ ] Best Practices Score: 90+

**SEO Checks:**
- [ ] Document has a meta description
- [ ] Document has a valid title
- [ ] Links are crawlable
- [ ] Page isn't blocked from indexing
- [ ] Document has a valid `hreflang`
- [ ] Robots.txt is valid

#### Mobile-Friendly Test
1. Go to: https://search.google.com/test/mobile-friendly
2. Enter your URL

- [ ] Page is mobile-friendly
- [ ] No mobile usability issues

### Social Media Preview

#### Facebook Sharing Debugger
1. Go to: https://developers.facebook.com/tools/debug/
2. Enter: `https://elo.42heilbronn.de/`

- [ ] Preview loads correctly
- [ ] Title displays properly
- [ ] Description displays properly
- [ ] No warnings or errors

#### Twitter Card Validator
1. Go to: https://cards-dev.twitter.com/validator
2. Enter: `https://elo.42heilbronn.de/`

- [ ] Preview loads correctly
- [ ] Card type: Summary
- [ ] Title and description display properly

### Browser Tests

Test in multiple browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

For each browser, verify:
- [ ] Meta tags load correctly (View Page Source)
- [ ] Title updates on navigation
- [ ] No JavaScript errors in console

### SEO Tools Tests

#### Screaming Frog SEO Spider (Optional)
If you have access:
1. Crawl `https://elo.42heilbronn.de/`
2. Check for:
   - [ ] All pages have unique titles
   - [ ] All pages have unique descriptions
   - [ ] No duplicate content
   - [ ] All internal links work (200 status)
   - [ ] No broken links (404s)

#### Ahrefs/SEMrush (Optional)
If you have access:
- [ ] Site is crawlable
- [ ] No indexation issues
- [ ] Sitemap detected

## Google Search Console Setup

### Initial Setup
1. Go to: https://search.google.com/search-console
2. Add property: `https://elo.42heilbronn.de`
3. Verify ownership (DNS or HTML file method)

- [ ] Property added
- [ ] Ownership verified

### Submit Sitemap
1. Navigate to: Sitemaps → Add new sitemap
2. Enter: `sitemap.xml`
3. Submit

- [ ] Sitemap submitted
- [ ] No errors in sitemap processing
- [ ] Wait 24-48 hours for indexing

### Request Indexing
For each important page:
1. Use URL Inspection tool
2. Click "Request Indexing"

Priority pages to index:
- [ ] Homepage: `https://elo.42heilbronn.de/`
- [ ] Table Tennis: `https://elo.42heilbronn.de/leaderboard/table_tennis`
- [ ] Table Football: `https://elo.42heilbronn.de/leaderboard/table_football`

### Monitor Coverage
After 1 week:
- [ ] Check Coverage report for errors
- [ ] Verify pages are indexed
- [ ] Check for mobile usability issues
- [ ] Review Core Web Vitals

## Common Issues & Fixes

### Issue: Meta tags not showing
**Symptom:** View source shows default meta tags only
**Fix:**
- Clear browser cache
- Verify `HelmetProvider` wraps `<App />` in `main.tsx`
- Check for JavaScript errors in console

### Issue: Sitemap returns 404
**Symptom:** `curl` returns 404 for sitemap
**Fix:**
- Verify `frontend/public/sitemap.xml` exists
- Rebuild Docker container: `docker-compose up --build`
- Check Nginx config serves static files from `/usr/share/nginx/html`

### Issue: Robots.txt blocks everything
**Symptom:** Google Search Console shows all pages disallowed
**Fix:**
- Verify `robots.txt` has `Allow: /` for main paths
- Check `Disallow:` directives only block private routes

### Issue: Duplicate content
**Symptom:** Multiple URLs for same content
**Fix:**
- Verify canonical URLs are set correctly
- Check trailing slash handling in Nginx
- Use 301 redirects for old URLs

### Issue: Low SEO score in Lighthouse
**Common causes:**
- Missing meta description → Add to SEO component
- Title too long → Keep under 60 characters
- Links not crawlable → Remove JavaScript-only navigation
- No `robots.txt` → Verify file is accessible

## Analytics (Optional)

If you added Google Analytics or Umami:

### Google Analytics 4
- [ ] Tracking ID configured
- [ ] Real-time users showing
- [ ] Pages being tracked
- [ ] No tracking on localhost

### Umami
- [ ] Script tag added
- [ ] Site appears in Umami dashboard
- [ ] Events being tracked

## Maintenance Schedule

### Daily (First Week)
- [ ] Check Google Search Console for errors
- [ ] Monitor indexing progress

### Weekly (First Month)
- [ ] Review organic search traffic
- [ ] Check for crawl errors
- [ ] Monitor Core Web Vitals

### Monthly
- [ ] Update sitemap if new sports added
- [ ] Review and optimize meta descriptions based on CTR
- [ ] Check for broken links
- [ ] Update structured data if needed

### Quarterly
- [ ] Run full Lighthouse audit
- [ ] Review keyword performance
- [ ] Update content based on analytics
- [ ] Check competitor SEO strategies

## Success Metrics

Track these KPIs over time:

### Week 1-2
- [ ] Sitemap submitted and processed
- [ ] Homepage indexed
- [ ] Key pages indexed (leaderboards)

### Month 1
- [ ] 80%+ pages indexed
- [ ] Organic traffic > 0
- [ ] Average position < 50 for brand keywords

### Month 3
- [ ] All pages indexed
- [ ] Organic traffic growing week-over-week
- [ ] Average position < 20 for brand keywords
- [ ] CTR > 2% on search results

### Month 6
- [ ] Top 10 for "42 Heilbronn table tennis"
- [ ] Top 10 for "42 Heilbronn ELO"
- [ ] Organic traffic = 30%+ of total traffic
- [ ] CTR > 5% on search results

## Support

If you encounter issues not covered here:
1. Check `SEO_IMPLEMENTATION.md` for detailed documentation
2. Review React Helmet Async docs: https://github.com/staylor/react-helmet-async
3. Check Google Search Console Help: https://support.google.com/webmasters

## Final Verification

Before marking complete:
- [ ] All "Pre-Deployment" items checked
- [ ] All "Post-Deployment Testing" items checked
- [ ] Google Search Console configured
- [ ] Sitemap submitted
- [ ] Lighthouse SEO score 90+
- [ ] No critical errors in console
- [ ] Mobile-friendly test passes
- [ ] Social media previews work
- [ ] Documentation reviewed

**Date Completed:** ___________
**Verified By:** ___________
**Notes:** ___________
