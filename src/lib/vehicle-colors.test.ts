import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allImages,
  colorNames,
  colorSlug,
  coverImage,
  defaultColor,
  findColor,
  hexFor,
  resolveColors,
  resolveGallery,
} from "./vehicle-colors.ts";

const alto = {
  images: ["/shared-interior.webp", "/shared-engine.webp"],
  colors: [
    { name: "Black", units: 2, images: ["/black-1.webp", "/black-2.webp"] },
    { name: "Pearl White", hex: "#fafafa", images: ["/white-1.webp"] },
    { name: "Silver" },
  ],
};

test("colorSlug makes URL-safe slugs", () => {
  assert.equal(colorSlug("Pearl White"), "pearl-white");
  assert.equal(colorSlug("  Dark  Blue! "), "dark-blue");
  assert.equal(colorSlug("Gray"), "gray");
});

test("hexFor resolves exact, mixed-case, multi-word and spelling variants", () => {
  assert.equal(hexFor("Black"), "#1a1a1a");
  assert.equal(hexFor("SILVER"), "#c0c0c0");
  assert.equal(hexFor("Pearl White"), hexFor("white"));
  assert.equal(hexFor("Dark Blue"), hexFor("blue"));
  assert.equal(hexFor("Grey"), hexFor("Gray"));
  assert.equal(hexFor("Two-tone"), undefined);
  assert.equal(hexFor(""), undefined);
});

test("resolveColors keeps listed colors, fills missing hex, and flags sold-out ones", () => {
  const colors = resolveColors({ colors: [...alto.colors, { name: "Red", units: 0 }] });
  assert.deepEqual(
    colors.map((c) => [c.name, c.slug, c.soldOut]),
    [
      ["Black", "black", false],
      ["Pearl White", "pearl-white", false],
      ["Silver", "silver", false],
      ["Red", "red", true],
    ],
  );
  assert.equal(colors[0].hex, "#1a1a1a"); // looked up
  assert.equal(colors[1].hex, "#fafafa"); // explicit hex wins
  assert.equal(colors[0].units, 2);
  assert.deepEqual(colors[2].images, []); // no photos given
});

test("a legacy single color text resolves to one swatch with no own photos", () => {
  const colors = resolveColors({ color: "Silver", images: ["/a.webp"] });
  assert.equal(colors.length, 1);
  assert.equal(colors[0].name, "Silver");
  assert.deepEqual(colors[0].images, []);
});

test("a legacy comma-separated color text splits into several swatches", () => {
  assert.deepEqual(resolveColors({ color: "Black, Blue" }).map((c) => c.name), ["Black", "Blue"]);
});

test("listed colors take priority over the legacy color text", () => {
  const colors = resolveColors({ color: "Red", colors: [{ name: "Blue" }] });
  assert.deepEqual(colors.map((c) => c.name), ["Blue"]);
});

test("no color information resolves to no colors", () => {
  assert.deepEqual(resolveColors({}), []);
  assert.deepEqual(resolveColors({ color: "  " }), []);
});

test("gallery for a color with photos: its photos first, then the shared ones", () => {
  const g = resolveGallery(alto, "pearl-white");
  assert.equal(g.color?.name, "Pearl White");
  assert.deepEqual(g.images, ["/white-1.webp", "/shared-interior.webp", "/shared-engine.webp"]);
});

test("gallery for a color without its own photos shows only the shared photos", () => {
  const g = resolveGallery(alto, "Silver");
  assert.equal(g.color?.name, "Silver");
  assert.deepEqual(g.images, ["/shared-interior.webp", "/shared-engine.webp"]);
});

test("color lookup ignores case and accepts a name or a slug", () => {
  assert.equal(resolveGallery(alto, "BLACK").color?.name, "Black");
  assert.equal(resolveGallery(alto, "Pearl White").color?.name, "Pearl White");
  assert.equal(resolveGallery(alto, "pearl-white").color?.name, "Pearl White");
});

test("an unknown or missing color falls back to the default color", () => {
  assert.equal(resolveGallery(alto, "purple").color?.name, "Black");
  assert.equal(resolveGallery(alto).color?.name, "Black");
  assert.deepEqual(resolveGallery(alto, "purple").images.slice(0, 2), ["/black-1.webp", "/black-2.webp"]);
});

test("the default color skips sold-out colors, but falls back to the first if all are sold out", () => {
  const soldFirst = resolveColors({ colors: [{ name: "Black", units: 0 }, { name: "Blue", units: 1 }] });
  assert.equal(defaultColor(soldFirst)?.name, "Blue");
  const allSold = resolveColors({ colors: [{ name: "Black", units: 0 }, { name: "Blue", units: 0 }] });
  assert.equal(defaultColor(allSold)?.name, "Black");
  assert.equal(defaultColor([]), undefined);
});

test("a vehicle with no colors shows its shared photos", () => {
  const g = resolveGallery({ images: ["/a.webp", "/b.webp"] });
  assert.equal(g.color, undefined);
  assert.deepEqual(g.images, ["/a.webp", "/b.webp"]);
});

test("a vehicle with no photos at all gives an empty gallery", () => {
  assert.deepEqual(resolveGallery({}).images, []);
  assert.equal(coverImage({}), undefined);
});

test("duplicate photos are shown once", () => {
  const g = resolveGallery({ images: ["/a.webp"], colors: [{ name: "Red", images: ["/a.webp", "/r.webp"] }] });
  assert.deepEqual(g.images, ["/a.webp", "/r.webp"]);
});

test("the cover image is the default color's first photo, else the first shared photo", () => {
  assert.equal(coverImage(alto), "/black-1.webp");
  assert.equal(coverImage({ images: ["/s.webp"], colors: [{ name: "Red" }] }), "/s.webp");
});

test("allImages lists every photo across colors and shared, once", () => {
  assert.deepEqual(allImages(alto), [
    "/black-1.webp",
    "/black-2.webp",
    "/white-1.webp",
    "/shared-interior.webp",
    "/shared-engine.webp",
  ]);
  assert.deepEqual(allImages({}), []);
});

test("findColor returns undefined for empty input", () => {
  assert.equal(findColor(resolveColors(alto), ""), undefined);
  assert.equal(findColor(resolveColors(alto), undefined), undefined);
});

test("colorNames joins all color names, and matches the old text for legacy entries", () => {
  assert.equal(colorNames(alto), "Black, Pearl White, Silver");
  assert.equal(colorNames({ color: "Silver" }), "Silver");
  assert.equal(colorNames({ color: "Black, Blue" }), "Black, Blue");
  assert.equal(colorNames({ colors: [{ name: "Black" }, { name: "Blue" }] }), "Black, Blue");
  assert.equal(colorNames({}), "");
});
