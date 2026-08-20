import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Vehicles marked Sold are excluded from the sitemap — Google shouldn't keep
// re-crawling stale, no-longer-purchasable inventory pages as if they were fresh.
const vehiclesDir = path.join(__dirname, "src/content/vehicles");
const soldSlugs = new Set();
for (const file of fs.readdirSync(vehiclesDir)) {
  if (!/\.mdx?$/.test(file)) continue;
  const content = fs.readFileSync(path.join(vehiclesDir, file), "utf-8");
  if (/^status:\s*Sold\s*$/m.test(content)) {
    soldSlugs.add(file.replace(/\.mdx?$/, ""));
  }
}

// Real per-file lastmod from git history, instead of one identical
// "now" timestamp stamped onto every URL on every build.
const lastmodCache = new Map();
function gitLastmod(absPath) {
  if (lastmodCache.has(absPath)) return lastmodCache.get(absPath);
  let date;
  try {
    const out = execSync(`git log -1 --format=%cI -- "${absPath}"`, { cwd: __dirname })
      .toString()
      .trim();
    date = out ? new Date(out) : new Date();
  } catch {
    date = new Date();
  }
  lastmodCache.set(absPath, date);
  return date;
}

function sourceFileFor(pathname) {
  const segments = pathname.replace(/^\/|\/$/g, "").split("/").filter(Boolean);

  const collectionDirs = {
    vehicles: "src/content/vehicles",
    blog: "src/content/blog",
    services: "src/content/services",
  };

  if (segments.length === 2 && collectionDirs[segments[0]]) {
    const dir = path.join(__dirname, collectionDirs[segments[0]]);
    for (const ext of [".md", ".mdx"]) {
      const file = path.join(dir, segments[1] + ext);
      if (fs.existsSync(file)) return file;
    }
  }

  const name = segments[0] || "index";
  for (const candidate of [
    path.join(__dirname, `src/pages/${name}.astro`),
    path.join(__dirname, `src/pages/${name}/index.astro`),
  ]) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

export default defineConfig({
  site: "https://ashazautoz.com",
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  integrations: [
    mdx(),
    sitemap({
      changefreq: "weekly",
      priority: 0.7,
      // Internal, noindex admin tooling and sold-out inventory should never
      // be submitted for indexing — see /app/* noindex tags and soldSlugs above.
      filter: (page) => {
        const url = new URL(page);
        if (url.pathname.startsWith("/app/")) return false;
        const vehicleMatch = url.pathname.match(/^\/vehicles\/([^/]+)\/$/);
        if (vehicleMatch && soldSlugs.has(vehicleMatch[1])) return false;
        return true;
      },
      serialize(item) {
        const url = new URL(item.url);
        const file = sourceFileFor(url.pathname);
        item.lastmod = (file ? gitLastmod(file) : new Date()).toISOString();
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    service: { entrypoint: "astro/assets/services/sharp" },
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "tet", "id"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
