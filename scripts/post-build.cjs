const fs = require("fs");
const path = require("path");

const DIST = path.join(__dirname, "..", "dist");
const BASE = "/ashaz-autoz";
const SITE = "https://irfatech.github.io";

/** Walk a directory recursively */
function walk(dir, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, callback);
    } else {
      callback(full);
    }
  }
}

/** Prefix the root-relative path with BASE, unless it's already prefixed or external. */
function prefix(pathStr) {
  if (!pathStr.startsWith("/")) return pathStr;
  if (pathStr.startsWith(BASE + "/")) return pathStr;
  if (pathStr.startsWith("//")) return pathStr;
  return BASE + pathStr;
}

/** Fix srcset attribute values (comma-separated URLs with optional descriptors). */
function fixSrcset(value) {
  return value
    .split(",")
    .map((part) => {
      const trimmed = part.trim();
      const tokens = trimmed.split(/\s+/);
      if (tokens.length > 0) {
        tokens[0] = prefix(tokens[0]);
      }
      return tokens.join(" ");
    })
    .join(", ");
}

let totalFiles = 0;
let totalReplacements = 0;

walk(DIST, (filePath) => {
  if (!filePath.endsWith(".html")) return;

  let content = fs.readFileSync(filePath, "utf-8");
  const original = content;

  // href, src, action, content
  content = content.replace(
    /((?:href|src|action|content)\s*=\s*")(\/[^"]*)/gi,
    (match, attr, url) => {
      const fixed = prefix(url);
      if (fixed !== url) totalReplacements++;
      return attr + fixed;
    },
  );

  // srcset (comma-separated list)
  content = content.replace(
    /(srcset\s*=\s*")([^"]*)"/gi,
    (match, attr, value) => {
      const fixed = fixSrcset(value);
      if (fixed !== value) totalReplacements++;
      return attr + fixed + '"';
    },
  );

  // Full URLs in content/href/src that miss the base path
  content = content.replace(
    new RegExp(`((?:content|href|src)\\s*=\\s*")${SITE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?!/(?:ashaz-autoz|[?#]))`, "gi"),
    (match, attr) => {
      totalReplacements++;
      return attr + SITE + BASE;
    },
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf-8");
    totalFiles++;
  }
});

console.log(`Post-build: prefixed paths in ${totalFiles} files (${totalReplacements} replacements)`);
