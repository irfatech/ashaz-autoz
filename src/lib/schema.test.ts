import { test } from "node:test";
import assert from "node:assert/strict";
import { vehicleSchema } from "./schema.ts";

const base = {
  brand: "Suzuki",
  model: "Alto",
  year: 2021,
  mileage: 12000,
  price: 5000,
  currency: "USD",
  transmission: "Automatic",
  fuelType: "Petrol",
  driveType: "FWD",
  status: "Available",
};
const url = "https://example.com/vehicles/suzuki-alto-2021/";

test("a single color is written as plain text", () => {
  assert.equal(vehicleSchema({ ...base, color: ["White"] }, url).color, "White");
  assert.equal(vehicleSchema({ ...base, color: "White" }, url).color, "White");
});

test("several colors are written as a list", () => {
  assert.deepEqual(vehicleSchema({ ...base, color: ["Black", "White"] }, url).color, ["Black", "White"]);
});

test("no color, or blank names, leave the color out", () => {
  assert.equal("color" in vehicleSchema(base, url), false);
  assert.equal("color" in vehicleSchema({ ...base, color: [] }, url), false);
  assert.equal("color" in vehicleSchema({ ...base, color: ["  "] }, url), false);
});

test("photos are passed through, and left out when there are none", () => {
  const photos = ["https://example.com/a.webp", "https://example.com/b.webp"];
  assert.deepEqual(vehicleSchema({ ...base, images: photos }, url).image, photos);
  assert.equal("image" in vehicleSchema({ ...base, images: [] }, url), false);
});

test("the offer links back to the seller and carries the price", () => {
  const car = vehicleSchema(base, url, "https://example.com/#organization");
  assert.equal(car.offers.price, 5000);
  assert.deepEqual(car.offers.seller, { "@id": "https://example.com/#organization" });
});

test("price on request omits the price and currency together", () => {
  const offer = vehicleSchema({ ...base, priceOnRequest: true }, url).offers;
  assert.equal("price" in offer, false);
  assert.equal("priceCurrency" in offer, false);
});
