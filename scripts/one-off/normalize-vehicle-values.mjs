// One-off: make the values already stored in the car files match the vehicle form's new pick-lists
// (engine sizes, feature names, color spelling, one brand typo). Only the lines it names are changed;
// everything else in each file keeps its exact formatting. Files that already match are left alone, so
// it is safe to run twice.
//
// Run: node scripts/one-off/normalize-vehicle-values.mjs --dry-run              (print every change, write nothing)
//      node scripts/one-off/normalize-vehicle-values.mjs --only=engine           (one group: color | engine | features | brand)
//      node scripts/one-off/normalize-vehicle-values.mjs                         (all groups, write the changes)
import fs from "node:fs";
import path from "node:path";

const dryRun = process.argv.includes("--dry-run");
const onlyArg = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const wants = (group) => !onlyArg || onlyArg === group;
const dir = path.resolve(import.meta.dirname, "../../src/content/vehicles");

// ---- the new pick-lists (these become the options in public/admin/config.yml) ----
const ENGINES = ["660cc", "660cc Turbo", "800cc", "1000cc", "1200cc", "1300cc", "1500cc", "1500cc Turbo", "1800cc", "2000cc", "2000cc Turbo", "2400cc", "2400cc Turbo", "2500cc", "2700cc", "2800cc Turbo", "3000cc", "3500cc", "4000cc", "Electric"];
const FEATURES = ["Air Conditioning", "Power Steering", "Power Windows", "Central Locking", "ABS Brakes", "Dual Airbags", "7 Airbags", "Bluetooth", "Apple CarPlay", "Android Auto", "Navigation", "Reverse Camera", "Parking Sensors", "Blind Spot Monitor", "Cruise Control", "Keyless Entry", "Push Start", "Leather Seats", "Sunroof", "Alloy Wheels", "Fog Lights", "Roof Rails", "Tow Bar", "AllGrip Pro 4WD", "Brand New (0 km)", "Japanese Import"];

// ---- how each existing spelling maps to the new lists ----
const ENGINE_MAP = { "660": "660cc", "1000": "1000cc", "1800": "1800cc", "2000": "2000cc", "1240 cc": "1200cc", "1.5L": "1500cc", "1.2L": "1200cc", "1.5L Turbo": "1500cc Turbo", "2.4L Turbo": "2400cc Turbo", "": null };
const FEATURE_MAP = {
  "Japanese vehicles": "Japanese Import", "Japense Vehicles": "Japanese Import", "Japanese Vehicles": "Japanese Import", "Japenese Vehicles": "Japanese Import",
  "Leather Interior": "Leather Seats",
  // these repeat other fields (color, model, seats, transmission), so they are dropped
  "Black": null, "Blue": null, "Nissan Xtrail": null, "7 Seats": null, "Automatic Transmission": null,
};
const COLOR_MAP = { Gray: "Grey" };

const unquote = (v) => v.trim().replace(/^(['"])(.*)\1$/, "$2");
const changes = [];
const unmapped = [];

for (const file of fs.readdirSync(dir).filter((f) => /\.mdx?$/.test(f)).sort()) {
  const full = path.join(dir, file);
  const text = fs.readFileSync(full, "utf8");
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error(`${file}: no front matter`);
  let lines = match[1].split("\n");
  const note = (field, before, after) => changes.push({ file, field, before, after });

  // engine
  const ei = wants("engine") ? lines.findIndex((l) => /^engine:/.test(l)) : -1;
  if (ei !== -1) {
    const before = unquote(lines[ei].replace(/^engine:/, ""));
    if (!ENGINES.includes(before)) {
      if (before in ENGINE_MAP) {
        const after = ENGINE_MAP[before];
        note("engine", before === "" ? "(empty)" : before, after ?? "(removed)");
        if (after === null) lines.splice(ei, 1);
        else lines[ei] = `engine: ${after}`;
      } else unmapped.push(`${file}: engine "${before}"`);
    }
  }

  // features (a block list, or `features: []`)
  const fi = wants("features") ? lines.findIndex((l) => /^features:/.test(l)) : -1;
  if (fi !== -1) {
    let end = fi + 1;
    while (end < lines.length && /^  - /.test(lines[end])) end++;
    const before = lines.slice(fi + 1, end).map((l) => unquote(l.replace(/^  - /, "")));
    const after = [];
    for (const f of before) {
      const mapped = f in FEATURE_MAP ? FEATURE_MAP[f] : f;
      if (mapped === null) continue;
      if (!FEATURES.includes(mapped)) { unmapped.push(`${file}: feature "${f}"`); after.push(f); continue; }
      if (!after.includes(mapped)) after.push(mapped);
    }
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      note("features", before.join(", ") || "(none)", after.join(", ") || "(none)");
      lines.splice(fi, end - fi, ...(after.length ? ["features:", ...after.map((f) => `  - ${f}`)] : ["features: []"]));
    }
  }

  // color names
  lines = lines.map((l) => {
    const m = l.match(/^(\s+- name: )(.+)$/);
    if (wants("color") && m && unquote(m[2]) in COLOR_MAP) {
      note("color", unquote(m[2]), COLOR_MAP[unquote(m[2])]);
      return `${m[1]}${COLOR_MAP[unquote(m[2])]}`;
    }
    return l;
  });

  // the one brand typo: "Land Crusier" is Toyota's Land Cruiser Prado
  const bi = wants("brand") ? lines.findIndex((l) => /^brand: Land Crusier$/.test(l)) : -1;
  if (bi !== -1) {
    const mi = lines.findIndex((l) => /^model: Prado$/.test(l));
    if (mi === -1) unmapped.push(`${file}: brand "Land Crusier" but model is not "Prado"`);
    else {
      note("brand", "Land Crusier", "Toyota");
      note("model", "Prado", "Land Cruiser Prado");
      lines[bi] = "brand: Toyota";
      lines[mi] = "model: Land Cruiser Prado";
    }
  }

  const out = `---\n${lines.join("\n")}\n---${text.slice(match[0].length)}`;
  if (out !== text && !dryRun) fs.writeFileSync(full, out);
}

// ---- report ----
const byFile = new Map();
for (const c of changes) byFile.set(c.file, [...(byFile.get(c.file) ?? []), c]);
for (const [file, list] of byFile) {
  console.log(`\n${file}`);
  for (const c of list) console.log(`  ${c.field.padEnd(9)} ${c.before}  →  ${c.after}`);
}
console.log(`\n${dryRun ? "Dry run: " : ""}${changes.length} change(s) in ${byFile.size} of ${fs.readdirSync(dir).filter((f) => /\.mdx?$/.test(f)).length} files${dryRun ? " (nothing written)" : ""}`);
if (unmapped.length) {
  console.log("\nNEEDS A DECISION (not in any list, left as is):");
  for (const u of unmapped) console.log(`  ${u}`);
  process.exitCode = 1;
}
