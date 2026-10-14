// Content lint for vehicle files. Catches mistakes the build alone does not:
// a year typed into `model`, two vehicles that would render the same page title,
// a vehicle with no photo, or a VIN / registration number entered twice.
//
// Run: npm run check:content   (exit code 1 on any error)
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { legacyVehicleKeys, vehiclesSchema } from "../src/lib/content-schemas.ts";
import { allImages, colorSlug } from "../src/lib/vehicle-colors.ts";

const dir = path.resolve(import.meta.dirname, "../src/content/vehicles");
const errors = [];
const legacyWarnings = [];
const vehicles = [];

for (const file of fs.readdirSync(dir).filter((f) => /\.mdx?$/.test(f)).sort()) {
  const text = fs.readFileSync(path.join(dir, file), "utf8");
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    errors.push(`${file}: no front matter`);
    continue;
  }
  const data = YAML.parse(match[1]) ?? {};
  const parsed = vehiclesSchema.safeParse(data);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`${file}: ${issue.path.join(".") || "(root)"} — ${issue.message}`);
    }
    continue;
  }
  vehicles.push({ file, data: parsed.data });
  const legacy = legacyVehicleKeys.filter((k) => k in data);
  if (legacy.length) legacyWarnings.push(`${file}: legacy key(s) ${legacy.join(", ")} (written by the old CMS form; safe to delete)`);
}

const warnings = [];

// A duplicate that involves a Sold vehicle is only a warning: sold pages are left out of the
// sitemap, so they cannot compete with a live listing. Two live vehicles are a hard error.
const seen = (map, key, file, label, status) => {
  if (!key) return;
  const k = String(key).trim().toLowerCase();
  const other = map.get(k);
  if (!other) {
    map.set(k, { file, status });
    return;
  }
  const message = `${file}: ${label} "${key}" is already used by ${other.file}`;
  if (status === "Sold" || other.status === "Sold") warnings.push(message);
  else errors.push(message);
};

const titles = new Map();
const vins = new Map();
const chassis = new Map();
const registrations = new Map();

for (const { file, data } of vehicles) {
  if (/^\d{4}$/.test(String(data.model).trim())) {
    errors.push(`${file}: model "${data.model}" looks like a year; model is the car model, e.g. Alto`);
  }
  seen(titles, `${data.brand} ${data.model} ${data.year}`, file, "page title", data.status);
  seen(vins, data.vin, file, "VIN", data.status);
  seen(chassis, data.chassisNumber, file, "chassis number", data.status);
  seen(registrations, data.registrationNo, file, "registration number", data.status);
  const colorSlugs = new Set();
  for (const color of data.colors) {
    const slug = colorSlug(color.name);
    if (!slug) errors.push(`${file}: color "${color.name}" has no usable letters or digits`);
    else if (colorSlugs.has(slug)) errors.push(`${file}: color "${color.name}" is listed twice`);
    colorSlugs.add(slug);
  }
  // A photo can be shared by all colors or belong to one color; either counts.
  if (allImages(data).length === 0) {
    const message = `${file}: needs at least one photo`;
    if (data.status === "Sold") warnings.push(message);
    else errors.push(message);
  }
}

for (const w of [...warnings, ...legacyWarnings]) console.warn(`  ! warning: ${w}`);

if (errors.length) {
  console.error(`check:content — ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`check:content — ${vehicles.length} vehicles OK`);
