#!/bin/bash

# SEO Verification Script
# Checks that all SEO files are in place before deployment

echo "🔍 Verifying SEO Implementation..."
echo ""

ERRORS=0

# Check if public directory exists
if [ ! -d "public" ]; then
  echo "❌ public/ directory not found"
  ERRORS=$((ERRORS + 1))
else
  echo "✓ public/ directory exists"
fi

# Check robots.txt
if [ ! -f "public/robots.txt" ]; then
  echo "❌ public/robots.txt not found"
  ERRORS=$((ERRORS + 1))
else
  echo "✓ public/robots.txt exists"
  if grep -q "Sitemap:" "public/robots.txt"; then
    echo "  ✓ Contains Sitemap directive"
  else
    echo "  ⚠️  Warning: No Sitemap directive found"
  fi
fi

# Check sitemap.xml
if [ ! -f "public/sitemap.xml" ]; then
  echo "❌ public/sitemap.xml not found"
  ERRORS=$((ERRORS + 1))
else
  echo "✓ public/sitemap.xml exists"
  if head -n 1 "public/sitemap.xml" | grep -q "<?xml"; then
    echo "  ✓ Valid XML format"
  else
    echo "  ⚠️  Warning: May not be valid XML"
  fi
fi

# Check SEO component
if [ ! -f "src/components/SEO.tsx" ]; then
  echo "❌ src/components/SEO.tsx not found"
  ERRORS=$((ERRORS + 1))
else
  echo "✓ src/components/SEO.tsx exists"
fi

# Check if react-helmet-async is in package.json
if grep -q "react-helmet-async" "package.json"; then
  echo "✓ react-helmet-async dependency added"
else
  echo "❌ react-helmet-async not in package.json"
  ERRORS=$((ERRORS + 1))
fi

# Check if HelmetProvider is in main.tsx
if grep -q "HelmetProvider" "src/main.tsx"; then
  echo "✓ HelmetProvider added to main.tsx"
else
  echo "❌ HelmetProvider not found in main.tsx"
  ERRORS=$((ERRORS + 1))
fi

# Check if index.html has JSON-LD
if grep -q "application/ld+json" "index.html"; then
  echo "✓ JSON-LD structured data in index.html"
else
  echo "⚠️  Warning: No JSON-LD structured data in index.html"
fi

# Check if sitemap generator exists
if [ ! -f "scripts/generate-sitemap.js" ]; then
  echo "❌ scripts/generate-sitemap.js not found"
  ERRORS=$((ERRORS + 1))
else
  echo "✓ Sitemap generator script exists"
fi

# Check if build script includes sitemap generation
if grep -q "generate-sitemap" "package.json"; then
  echo "✓ Build script includes sitemap generation"
else
  echo "⚠️  Warning: Build script doesn't include sitemap generation"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ]; then
  echo "✅ All SEO checks passed! Ready to build and deploy."
  exit 0
else
  echo "❌ $ERRORS error(s) found. Please fix before deploying."
  exit 1
fi
