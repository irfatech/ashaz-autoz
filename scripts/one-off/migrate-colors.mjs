// One-off: convert the old single `color: Silver` line in every vehicle file to the `colors` list.
//
//   color: Silver            colors:
//                       →      - name: Silver
//   color: Black, Blue       colors:
//                       →      - name: Black
//                              - name: Blue
//
// Only that one line is rewritten (the rest of each file keeps its exact formatting), the photos stay
// where they are as shared photos, and files that already have `colors:` are left alone, so it is
// safe to run twice.
//
// Run: node scripts/one-off/migrate-colors.mjs --dry-run   (print the plan)
//      node scripts/one-off/migrate-colors.mjs             (write the changes)
import fs from "node:fs";
import path from "node:path";

const dryRun = process.argv.includes("--dry-run");
const dir = path.resolve(import.meta.dirname, "../../src/content/vehicles");

const plain = (name) => (/^[A-Za-z][A-Za-z0-9 -]*$/.test(name) ? name : JSON.stringify(name));
const unquote = (v) => v.trim().replace(/^(['"])(.*)\1$/, "$2");

let changed = 0;
for (const file of fs.readdirSync(dir).filter((f) => /\.mdx?$/.test(f)).sort()) {
  const full = path.join(dir, file);
  const text = fs.readFileSync(full, "utf8");
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error(`${file}: no front matter`);
  const lines = match[1].split("\n");

  if (lines.some((l) => /^colors:/.test(l))) {
    console.log(`skip     ${file} (already has colors)`);
    continue;
  }
  const index = lines.findIndex((l) => /^color:/.test(l));
  if (index === -1) {
    console.log(`skip     ${file} (no color)`);
    continue;
  }

  const names = unquote(lines[index].replace(/^color:/, ""))
    .split(/[,/]/)
    .map((n) => n.trim())
    .filter(Boolean);
  const replacement = names.length ? ["colors:", ...names.map((n) => `  - name: ${plain(n)}`)] : [];
  lines.splice(index, 1, ...replacement);

  console.log(`${dryRun ? "would    " : "migrated "} ${file}: color → ${names.join(" + ") || "(removed)"}`);
  if (!dryRun) {
    fs.writeFileSync(full, `---\n${lines.join("\n")}\n---${text.slice(match[0].length)}`);
  }
  changed++;
}
console.log(`${dryRun ? "Dry run: " : ""}${changed} file(s) ${dryRun ? "would change" : "changed"}`);
