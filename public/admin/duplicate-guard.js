// Stops the owner adding a car that already exists (same brand, model and year).
// Sveltia silently names the second file "...-2021-1"; a new entry with that kind of ending means
// the car exists. Throwing from a preSave hook cancels the save. Give the car its own slug
// (e.g. suzuki-alto-2021-silver) when two different cars really do share brand, model and year.
CMS.registerEventListener({
  name: "preSave",
  handler: ({ entry }) => {
    const slug = String(entry.get("slug"));
    if (entry.get("collection") !== "vehicles" || !entry.get("newRecord")) return;
    if (!/-(?:19|20)\d\d-\d+$/.test(slug)) return;
    const car = ["brand", "model", "year"].map((k) => entry.getIn(["data", k])).join(" ");
    throw new Error(
      `${car} is already in your list, so it was not added again. Cancel, open that car and add the color or photos there.`,
    );
  },
});
