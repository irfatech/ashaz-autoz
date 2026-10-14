// Build step: writes the current model-year list into the DEPLOYED admin/config.yml (dist/), so the
// vehicle form's Year pick-list always runs from next year back to 2000 without anyone editing it.
// The source public/admin/config.yml keeps a static list that only serves local development.
//
// Run by `npm run build` after the site is built. Fails the build if the marker is missing.
import fs from "node:fs";
import path from "node:path";
import { replaceYearOptions, yearOptions } from "../src/lib/year-options.ts";

const file = path.resolve(import.meta.dirname, "../dist/admin/config.yml");
const years = yearOptions(new Date());

fs.writeFileSync(file, replaceYearOptions(fs.readFileSync(file, "utf8"), years));
console.log(`CMS config: year list ${years[0]} → ${years.at(-1)} (${years.length} years) written to dist/admin/config.yml`);
