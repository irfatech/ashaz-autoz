// One-off: give every existing car the `addedOn` date it should have had, taken from the date its
// file was first committed to git (following renames). Without it, a car with no `addedOn` is stamped
// "now" the first time it is saved in the CMS and would jump to the top of the list.
//
// Only adds one line at the end of each file's front matter; files that already have it are skipped,
// so it is safe to run twice.
//
// Run: node scripts/one-off/backfill-added-on.mjs --dry-run   (print the plan)
//      node scripts/one-off/backfill-added-on.mjs             (write the changes)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const dryRun = process.argv.includes("--dry-run");
const root = path.resolve(import.meta.dirname, "../..");
const dir = path.join(root, "src/content/vehicles");

// The CMS stores minute precision, e.g. 2026-10-14T07:02:00.000Z; use the same shape.
const asCmsTimestamp = (iso) => `${new Date(iso).toISOString().slice(0, 16)}:00.000Z`;

function firstCommitDate(relPath) {
  const out = execFileSync(
    "git",
    ["log", "--follow", "--diff-filter=A", "--format=%aI", "--", relPath],
    { cwd: root, encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .filter(Boolean);
  return out.at(-1); // the oldest "added" event
}

const rows = [];
for (const file of fs.readdirSync(dir).filter((f) => /\.mdx?$/.test(f)).sort()) {
  const full = path.join(dir, file);
  const text = fs.readFileSync(full, "utf8");
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error(`${file}: no front matter`);
  if (/^addedOn:/m.test(match[1])) {
    rows.push({ file, date: "(already has one)", skipped: true });
    continue;
  }
  const first = firstCommitDate(path.relative(root, full));
  if (!first) {
    rows.push({ file, date: "(not in git yet: left alone)", skipped: true });
    continue;
  }
  const date = asCmsTimestamp(first);
  rows.push({ file, date });
  if (!dryRun) {
    fs.writeFileSync(full, `---\n${match[1]}\naddedOn: ${date}\n---${text.slice(match[0].length)}`);
  }
}

const width = Math.max(...rows.map((r) => r.file.length));
for (const r of rows) console.log(`${r.skipped ? "skip " : dryRun ? "would" : "wrote"}  ${r.file.padEnd(width)}  ${r.date}`);
console.log(`${dryRun ? "Dry run: " : ""}${rows.filter((r) => !r.skipped).length} file(s) ${dryRun ? "would change" : "changed"}`);
