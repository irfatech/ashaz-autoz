// The model-year pick-list for the vehicle form, newest first: next year (so a new model can be listed
// early) down to the earliest year the site accepts.
//
// The CMS cannot build a pick-list in the browser, so the list is written into the deployed
// admin/config.yml at build time (scripts/generate-cms-config.mjs). The schema's maximum year uses the
// same rule, so the form and the schema always agree. Plain TypeScript, unit tested with `node --test`.

export const FIRST_VEHICLE_YEAR = 2000;

/** The newest model year a car may have: next year. */
export function maxVehicleYear(now: Date = new Date()): number {
  return now.getFullYear() + 1;
}

/** [next year, …, FIRST_VEHICLE_YEAR], newest first. */
export function yearOptions(now: Date = new Date(), first: number = FIRST_VEHICLE_YEAR): number[] {
  const years: number[] = [];
  for (let y = maxVehicleYear(now); y >= first; y--) years.push(y);
  return years;
}

const OPTIONS_LINE = /^(\s*# year-options:[^\n]*\n\s*options: )\[[\d,\s]*\]/m;

/**
 * Replaces the list on the line after the `# year-options:` marker comment in a CMS config. Throws
 * when the marker is missing, so a renamed or moved field fails the build instead of silently keeping
 * a stale list.
 */
export function replaceYearOptions(configText: string, years: number[]): string {
  if (!OPTIONS_LINE.test(configText)) {
    throw new Error("CMS config: could not find the `# year-options:` marker followed by an `options: [...]` line");
  }
  return configText.replace(OPTIONS_LINE, `$1[${years.join(", ")}]`);
}
