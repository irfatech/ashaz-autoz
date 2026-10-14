import { test } from "node:test";
import assert from "node:assert/strict";
import { maxVehicleYear, replaceYearOptions, yearOptions } from "./year-options.ts";

test("the list runs from next year down to 2000, newest first", () => {
  const years = yearOptions(new Date("2026-10-14T00:00:00Z"));
  assert.equal(years[0], 2027);
  assert.equal(years.at(-1), 2000);
  assert.equal(years.length, 28);
  assert.deepEqual(years, [...years].sort((a, b) => b - a));
  assert.equal(new Set(years).size, years.length);
});

test("the list moves on at the new year, and the schema maximum follows it", () => {
  assert.equal(yearOptions(new Date(2026, 11, 31))[0], 2027); // 31 Dec 2026
  assert.equal(yearOptions(new Date(2027, 0, 1))[0], 2028); // 1 Jan 2027
  assert.equal(maxVehicleYear(new Date(2026, 11, 31)), 2027);
  assert.equal(maxVehicleYear(new Date(2027, 0, 1)), 2028);
});

test("a custom first year is respected", () => {
  assert.deepEqual(yearOptions(new Date(2026, 5, 1), 2025), [2027, 2026, 2025]);
});

const config = `fields:
  - label: "Year"
    name: "year"
    widget: "select"
    # year-options: regenerated at build time; this list is only for local development
    options: [2027, 2026, 2025]
  - label: "Doors"
    options: [2, 3, 4, 5]
`;

test("only the year list after the marker is replaced", () => {
  const out = replaceYearOptions(config, [2028, 2027, 2026]);
  assert.match(out, /options: \[2028, 2027, 2026\]/);
  assert.match(out, /options: \[2, 3, 4, 5\]/); // other lists untouched
  assert.equal(out.split("\n").length, config.split("\n").length);
});

test("a missing marker fails instead of keeping a stale list", () => {
  assert.throws(() => replaceYearOptions(config.replace("# year-options:", "# something-else:"), [2027]), /marker/);
  assert.throws(() => replaceYearOptions("options: [1, 2]", [2027]), /marker/);
});
