const fs = require("fs");
const path = require("path");

const dist = path.resolve(__dirname, "..", "dist");

const SOURCE = path.join(dist, "sitemap-0.xml");
const raw = fs.readFileSync(SOURCE, "utf-8");

const urlRegex = /<url>[\s\S]*?<\/url>/g;
const entries = [];
let match;
while ((match = urlRegex.exec(raw)) !== null) {
  const block = match[0];
  const loc = (block.match(/<loc>(.*?)<\/loc>/) || [])[1];
  const lastmod = (block.match(/<lastmod>(.*?)<\/lastmod>/) || [])[1];
  const changefreq = (block.match(/<changefreq>(.*?)<\/changefreq>/) || [])[1];
  const priority = (block.match(/<priority>(.*?)<\/priority>/) || [])[1];
  if (loc) entries.push({ loc, lastmod, changefreq, priority });
}

function categorize(loc) {
  const u = new URL(loc);
  const path = u.pathname.replace(/\/$/, "");

  if (path === "" || ["/about", "/contact", "/faq", "/gallery", "/install", "/privacy", "/terms"].includes(path)) {
    return "main";
  }
  if (path.startsWith("/blog")) return "blog";
  if (path.startsWith("/services")) return "services";
  if (path.startsWith("/vehicles")) return "vehicles";
  return "other";
}

const groups = { main: [], blog: [], services: [], vehicles: [], other: [] };
for (const e of entries) {
  const cat = categorize(e.loc);
  groups[cat].push(e);
}

function buildSitemap(urlset) {
  const lines = [`<?xml version="1.0" encoding="UTF-8"?>`];
  lines.push(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`);
  for (const e of urlset) {
    lines.push("  <url>");
    lines.push(`    <loc>${e.loc}</loc>`);
    if (e.lastmod) lines.push(`    <lastmod>${e.lastmod}</lastmod>`);
    if (e.changefreq) lines.push(`    <changefreq>${e.changefreq}</changefreq>`);
    if (e.priority) lines.push(`    <priority>${e.priority}</priority>`);
    lines.push("  </url>");
  }
  lines.push("</urlset>");
  return lines.join("\n");
}

for (const [name, urlset] of Object.entries(groups)) {
  if (urlset.length === 0) continue;
  fs.writeFileSync(path.join(dist, `sitemap-${name}.xml`), buildSitemap(urlset), "utf-8");
}

const indexLines = [`<?xml version="1.0" encoding="UTF-8"?>`];
indexLines.push(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`);
for (const name of Object.keys(groups)) {
  if (groups[name].length === 0) continue;
  indexLines.push("  <sitemap>");
  indexLines.push(`    <loc>https://ashazautoz.com/sitemap-${name}.xml</loc>`);
  indexLines.push(`    <lastmod>${entries[0].lastmod}</lastmod>`);
  indexLines.push("  </sitemap>");
}
indexLines.push("</sitemapindex>");
fs.writeFileSync(path.join(dist, "sitemap-index.xml"), indexLines.join("\n"), "utf-8");

console.log("Categorized sitemaps generated:");
for (const [name, urlset] of Object.entries(groups)) {
  if (urlset.length > 0) console.log(`  sitemap-${name}.xml — ${urlset.length} URLs`);
}
