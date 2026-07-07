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

/* ── Generate sw.js with all known page URLs ── */

function walkDir(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkDir(full));
    else if (entry.isFile()) results.push(full);
  }
  return results;
}

const pageUrls = [];
const assetUrls = [
  "/fonts/inter-latin.woff2",
  "/fonts/bruno-ace-latin.woff2",
  "/fonts/lato-latin-300.woff2",
  "/fonts/lato-latin-400.woff2",
  "/fonts/lato-latin-700.woff2",
  "/manifest.json",
  "/favicon.svg",
  "/favicon-32x32.png",
  "/favicon-16x16.png",
  "/apple-touch-icon-180x180.png",
  "/apple-touch-icon-167x167.png",
  "/apple-touch-icon-152x152.png",
  "/apple-touch-icon-120x120.png",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/ashaz-logo.png",
  "/icon.png",
];

for (const file of walkDir(dist)) {
  if (!file.endsWith(".html")) continue;
  const rel = path.relative(dist, file);
  const parts = rel.split(path.sep);
  if (parts.includes("admin")) continue;
  if (parts.length === 1 && parts[0] !== "index.html") continue;
  pageUrls.push("/" + parts.slice(0, -1).join("/") + (parts[0] === "index.html" ? "" : "/"));
}

const allPrecache = [...new Set([...pageUrls, ...assetUrls])].sort();

const swLines = [`const CACHE_NAME = "ashaz-autoz-v2";`, ""];
swLines.push("const PRECACHE_URLS = [");
for (const url of allPrecache) {
  swLines.push(`  "${url}",`);
}
swLines.push("];");
swLines.push("");
swLines.push(`self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS);
      await self.skipWaiting();
    })(),
  );
});`);
swLines.push("");
swLines.push(`self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});`);
swLines.push("");
swLines.push(`async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
};`);
swLines.push("");
swLines.push(`async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match("/");
  }
};`);
swLines.push("");
swLines.push(`self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (!request.url.startsWith("http")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});`);

fs.writeFileSync(path.join(dist, "sw.js"), swLines.join("\n"), "utf-8");
console.log(`  sw.js generated — ${allPrecache.length} URLs precached`);
