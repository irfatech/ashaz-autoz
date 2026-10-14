// CMS ⇄ content-schema drift check. Compares the fields in public/admin/config.yml with the Zod
// schemas in src/lib/content-schemas.ts, so a field added on one side cannot silently be dropped
// (or fail the build) on the other.
//
// Run: npm run check:cms   (exit code 1 on any drift)
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import * as S from "../src/lib/content-schemas.ts";

const root = path.resolve(import.meta.dirname, "..");
const config = YAML.parse(fs.readFileSync(path.join(root, "public/admin/config.yml"), "utf8"));

const schemas = {
  pages: S.pagesSchema,
  blog: S.blogSchema,
  vehicles: S.vehiclesSchema,
  services: S.servicesSchema,
  testimonials: S.testimonialsSchema,
  team: S.teamSchema,
  faq: S.faqSchema,
  gallery: S.gallerySchema,
  "site-settings": S.siteSettingsSchema,
  navigation: S.navigationSchema,
  tiktok: S.tiktokSchema,
  instagram: S.instagramSchema,
  footer: S.footerSchema,
};

// Schema keys that intentionally have no CMS field: they have defaults, are rarely changed, or are
// maintained in the files. Anything NOT listed here must exist in the CMS form, and vice versa.
const schemaOnly = {
  "*": ["lang", "seo", "slug", "canonical"],
  // `title` and `color` are legacy keys: still valid in old files, no longer in the CMS form.
  vehicles: ["title", "color"],
  services: ["icon"],
  team: ["email", "phone"],
  "site-settings": ["logoDark", "currency", "language", "languages"],
};

// The Markdown body is not front matter, so it never appears in the schema.
const cmsOnly = { "*": ["body"] };

// CMS select options that must equal a Zod enum: [collection, field, expected options].
const enumPairs = [
  ["vehicles", "transmission", S.transmissions],
  ["vehicles", "fuelType", S.fuelTypes],
  ["vehicles", "driveType", S.driveTypes],
  ["vehicles", "status", S.vehicleStatuses],
  ["vehicles", "bodyType", S.bodyTypes],
];

const unwrap = (t) => {
  while (["optional", "default", "nullable"].includes(t.def.type)) t = t.def.innerType;
  return t;
};
const allowed = (map, collection) => [...(map["*"] ?? []), ...(map[collection] ?? [])];
const problems = [];

function compare(label, cmsFields, zodObject, collection) {
  const shape = zodObject.shape;
  const cmsByName = new Map(cmsFields.map((f) => [f.name, f]));
  for (const name of cmsByName.keys()) {
    if (!(name in shape) && !allowed(cmsOnly, collection).includes(name)) {
      problems.push(`${label}: CMS field "${name}" is not in the content schema`);
    }
  }
  for (const [name, type] of Object.entries(shape)) {
    const field = cmsByName.get(name);
    if (!field) {
      if (!allowed(schemaOnly, collection).includes(name)) {
        problems.push(`${label}: schema key "${name}" has no CMS field (add it, or list it as schema-only)`);
      }
      continue;
    }
    const requiredBySchema = !type.safeParse(undefined).success;
    if (requiredBySchema && field.required === false) {
      problems.push(`${label}: "${name}" is required by the schema but optional in the CMS`);
    }
    const inner = unwrap(type);
    if (inner.def.type === "object" && Array.isArray(field.fields)) {
      compare(`${label}.${name}`, field.fields, inner, collection);
    }
    // A list of objects (e.g. vehicle colors): compare each item's fields with the element schema.
    if (inner.def.type === "array" && Array.isArray(field.fields)) {
      const element = unwrap(inner.def.element);
      if (element.def.type === "object") compare(`${label}.${name}[]`, field.fields, element, collection);
    }
  }
}

const seenCollections = new Set();
for (const collection of config.collections) {
  const zodObject = schemas[collection.name];
  if (!zodObject) {
    problems.push(`collection "${collection.name}" has no schema in content-schemas.ts`);
    continue;
  }
  seenCollections.add(collection.name);
  const fields = collection.fields ?? collection.files?.[0]?.fields ?? [];
  compare(collection.name, fields, zodObject, collection.name);
}
for (const name of Object.keys(schemas)) {
  if (!seenCollections.has(name)) problems.push(`schema "${name}" has no CMS collection`);
}

for (const [collection, field, expected] of enumPairs) {
  const cmsField = config.collections
    .find((c) => c.name === collection)
    ?.fields?.find((f) => f.name === field);
  const options = (cmsField?.options ?? []).map((o) => (typeof o === "object" ? o.value : o));
  if (JSON.stringify(options) !== JSON.stringify([...expected])) {
    problems.push(
      `${collection}.${field}: CMS options [${options.join(", ")}] differ from schema [${expected.join(", ")}]`,
    );
  }
}

if (problems.length) {
  console.error(`check:cms — ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`check:cms — ${seenCollections.size} collections match the content schema`);
