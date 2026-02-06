#!/usr/bin/env node

/**
 * Sitemap Generator for ELO Leaderboard
 *
 * This script generates a dynamic sitemap.xml based on the current sports configuration
 * and can be extended to include player profiles.
 *
 * Usage: node scripts/generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.VITE_BASE_URL || 'https://eloleaderboard.de';

// Static routes with their priorities and change frequencies
const staticRoutes = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/login', priority: 0.5, changefreq: 'monthly' },
  { path: '/impressum', priority: 0.3, changefreq: 'monthly' },
  { path: '/privacy', priority: 0.3, changefreq: 'monthly' },
  { path: '/terms', priority: 0.3, changefreq: 'monthly' },
];

// Dynamic sport routes
const sportRoutes = [
  { id: 'table_tennis', priority: 0.9, changefreq: 'daily' },
  { id: 'table_football', priority: 0.9, changefreq: 'daily' },
  { id: 'super_smash_bros', priority: 0.8, changefreq: 'daily' },
  { id: 'chess', priority: 0.8, changefreq: 'daily' },
];

function generateSitemap() {
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

`;

  // Add static routes
  staticRoutes.forEach(route => {
    xml += `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>

`;
  });

  // Add sport leaderboard routes
  sportRoutes.forEach(sport => {
    xml += `  <url>
    <loc>${BASE_URL}/leaderboard/${sport.id}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${sport.changefreq}</changefreq>
    <priority>${sport.priority}</priority>
  </url>

`;
  });

  xml += `</urlset>`;

  return xml;
}

function main() {
  try {
    const sitemap = generateSitemap();
    const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');

    // Ensure public directory exists
    const publicDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, sitemap, 'utf8');
    console.log(`✓ Sitemap generated successfully at ${outputPath}`);
    console.log(`  Total URLs: ${staticRoutes.length + sportRoutes.length}`);
  } catch (error) {
    console.error('✗ Failed to generate sitemap:', error.message);
    process.exit(1);
  }
}

main();
