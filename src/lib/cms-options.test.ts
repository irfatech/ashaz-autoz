import { test } from "node:test";
import assert from "node:assert/strict";
import { findViolations, optionValues, type CmsField } from "./cms-options.ts";

const fields: CmsField[] = [
  { name: "brand", widget: "select", options: ["Toyota", "Nissan"] },
  { name: "year", widget: "select", options: [2022, 2021, 2020] },
  { name: "doors", widget: "select", options: [{ label: "Five", value: 5 }, { label: "Four", value: 4 }] },
  { name: "features", widget: "select", multiple: true, options: ["Bluetooth", "Sunroof"] },
  { name: "model", widget: "string" },
  {
    name: "colors",
    widget: "list",
    fields: [
      { name: "name", widget: "select", options: ["White", "Black"] },
      { name: "units", widget: "number" },
    ],
  },
];

test("values the form offers are accepted", () => {
  const data = { brand: "Toyota", year: 2021, doors: 5, features: ["Bluetooth"], colors: [{ name: "White", units: 2 }] };
  assert.deepEqual(findViolations(fields, data), []);
});

test("a value the form does not offer is reported with its location and the allowed choices", () => {
  const [v] = findViolations(fields, { brand: "Toyata" });
  assert.equal(v.path, "brand");
  assert.equal(v.value, "Toyata");
  assert.deepEqual(v.allowed, ["Toyota", "Nissan"]);
});

test("numbers and text compare by their text, so 2021 matches the option 2021 and '5' matches 5", () => {
  assert.deepEqual(findViolations(fields, { year: "2021", doors: "5" }), []);
  assert.equal(findViolations(fields, { year: 2019 }).length, 1);
});

test("options given as { label, value } compare by value, not label", () => {
  assert.deepEqual(optionValues([{ label: "Five", value: 5 }, "Four"]), ["5", "Four"]);
  assert.equal(findViolations(fields, { doors: "Five" }).length, 1);
});

test("every value of a multi-select is checked", () => {
  const found = findViolations(fields, { features: ["Bluetooth", "Japense Vehicles", "Sunroof", "Black"] });
  assert.deepEqual(found.map((v) => v.value), ["Japense Vehicles", "Black"]);
});

test("items inside a list of objects are checked, with the item number in the path", () => {
  const found = findViolations(fields, { colors: [{ name: "White" }, { name: "Gray" }] });
  assert.equal(found.length, 1);
  assert.equal(found[0].path, "colors[1].name");
});

test("empty values and fields that are not pick-lists are ignored", () => {
  assert.deepEqual(findViolations(fields, { brand: "", year: null, model: "Anything goes", features: [] }), []);
  assert.deepEqual(findViolations(fields, {}), []);
});
