# Spec: A Faster, Shorter Vehicle Form

Status: APPROVED by the owner (brand list confirmed; all other open questions accepted with the defaults). Updated with the "recently added" requirement and findings verified in the real CMS. Not yet built.
Related: [SPEC.md](SPEC.md) (earlier CMS work). This spec only changes the **Vehicles** form in the CMS.

## Objective

Let the owner add or update a car with as little typing and as few steps as possible, on a phone.

**User:** the car owner, editing in the CMS, probably on a phone and sometimes on a laptop.
**Two jobs, in order of how often they happen:**
1. *Update* a car: change status (Available → Sold), price or mileage. Should take about 3 taps.
2. *Add* a car: usually a model they have sold before, with a new year, color, price and mileage.

**Why now (measured, not guessed):**
- The form has **24 fields and is about 2,800 px tall** on a phone-width screen.
- A typical new car needs about **75 typed characters**, mostly the Features list (each feature typed by hand).
- Typing is already hurting the data: **engine has 14 different spellings across 23 cars** (`'660'`, `660cc`, `1.5L`, `1240 cc`, `2.4L Turbo`…); **features has 33 distinct values for 19 cars** (four spellings of "Japanese vehicles", plus stray entries like "Black" and "Nissan Xtrail"); the Prado is saved with brand **"Land Crusier"** (a typo, and the brand should be Toyota), which puts "Land Crusier Prado" in its page title.

**Also required (added after review):** a car you just saved must not get lost in the list. Today the list is grouped by status and sorted by year, so a new 2021 car sits among sixteen other 2021 cars. The list must open with the **most recently added car first**, and offer "Recently added" as a sort option.

**Principle:** pick from a list wherever the answer comes from a short, known set; type only where the answer is genuinely free (model, price, mileage, the four internal numbers). A pick-list also fixes the inconsistent data.

## What the CMS can and cannot do (verified against Sveltia 0.237.0's own schema)

- **Cannot** place two fields in one row. There is no width, column or layout option for fields. "Doors and seats on one row" is therefore not possible, and I will not fake it. The compact alternative is one short row of one-tap digits per field, with the usual value preselected.
- **Cannot** build the year list in the browser at load time: manual initialization *appends* to arrays and cannot edit an existing field's options. The year list is generated at build time instead (see Year below).
- **Can** show up to a chosen number of options as radio buttons (`dropdown_threshold`), turn a longer list into a dropdown, allow multiple choices (`multiple: true`), preselect a value (`default`), shorten the Markdown editor (`minimal`, `buttons`), and store numbers from a select (`value` can be a number).
- **Cannot** show a field only when another has a value, and cannot collapse a normal field (collapsing needs an Object field, which would change the stored data shape; ruled out).

## Assumptions (correct me now or I proceed with these)

1. Phone-first, but must work on a laptop.
2. The stored field names and shapes stay exactly the same, so the site, `/app`, the sitemap and the checks keep working. Only the *input widgets* change.
3. All cars are priced in USD, so Currency leaves the form (the schema already defaults to USD).
4. Existing values must never be lost: any value already in a car's file must be a valid choice in its new pick-list.
5. Fixing existing messy values (engine, features, the Prado, "Gray") is a **data change that needs your OK** before I run it.

## Field-by-field decisions

"Typing" = characters typed for a typical car (Toyota Aqua 2019, 1500cc, white, 58,000 km, $9,500).

| # | Field | Today | Proposed | Why | Data change |
|---|---|---|---|---|---|
| 1 | Brand | typed | **Pick-list of ~40 brands, ordered by how often you sell them** (Toyota, Nissan, Suzuki, Mitsubishi, Honda, Mazda, Daihatsu first, then the rest). **Searchable: typing 2–3 letters narrows the list** | Removes typos ("Land Crusier"); keeps URLs and titles consistent. A brand not in the list needs a one-line addition | none |
| 2 | Model | typed, guarded against a year | Typed (unchanged). One-line hint | Too many models for a list | none |
| 3 | Year | typed number | **Pick-list, newest first, from next year back to 2000** | 4 characters → 2 taps. Built at deploy time so it never goes out of date | none (still a number) |
| 4 | Status | radios, 4th | Radios, **moved up to 4th, directly under Year** | The most-edited field; visible without scrolling | none |
| 5 | Price | typed | Typed; keep `$` and numeric keypad. Hint trimmed to "0 if price on request" | Cannot be a list | none |
| 6 | Price on request | toggle | Toggle (unchanged) | | none |
| 7 | Mileage | typed | Typed; keep "km" and numeric keypad | | none |
| 8 | Gallery Images | drop zone | Unchanged, hint cut to one line | Already one step: multi-select or drag | none |
| 9 | Colors → name | typed | **Pick-list of ~18 common colors** (White, Black, Silver, Grey, Red, Blue, Green, Beige, Brown, Gold, Orange, Yellow, Pearl White, Dark Blue, …) | Zero typing; consistent names make the Color filter reliable | "Gray" → "Grey" (1 car) |
| 10 | Colors → swatch picker | optional color picker | **Removed from the form** | The site already looks the swatch up from the name; one less step per color | none (field stays in the schema) |
| 11 | Colors → stock, photos | | Unchanged | | none |
| 12 | Transmission, Fuel Type | radios, preselected | Unchanged | Already one tap or none | none |
| 13 | Drive Type | radios, no default | Unchanged (deliberate forced choice; a wrong default would be saved silently) | | none |
| 14 | Engine | typed, 14 spellings | **Pick-list of ~20 sizes** (660cc, 1000cc, 1200cc, 1300cc, 1500cc, 1800cc, 2000cc, 2400cc, … with Turbo variants). **Stays optional**, so an unusual engine never blocks saving | Consistency; fewer keystrokes | existing values normalized (map below) |
| 15 | Doors | typed number | **Radios 2 · 3 · 4 · 5, preselected 5** | One row, no typing (your cars: only 4 or 5) | none |
| 16 | Seats | typed number | **Radios 2 · 4 · 5 · 7 · 8 · 12, preselected 5** | One row, no typing (your cars: only 5 or 7) | none |
| 17 | Features | typed list, one by one | **Multi-select from ~25 common features** (Air Conditioning, Power Steering, Bluetooth, Apple CarPlay, Reverse Camera, Keyless Entry, Sunroof, …) | Biggest typing saving; same stored list of text | existing values normalized (map below) |
| 18 | Featured | toggle, mid-form | Toggle, relabelled "Show on home page", **moved down** | Rarely changed | none |
| 19 | Body Type | optional dropdown | **Removed from the form** (stays in the schema) | Optional, only feeds structured data, nobody asked for it | none |
| 20 | Currency | text, default USD | **Removed from the form** (schema defaults to USD) | Never changes | none |
| 21 | Description | full Markdown editor | Shorter editor (`minimal`, fewer buttons), at the bottom | Existing descriptions just repeat the specs | none |
| 22–25 | VIN, Chassis, Engine No., Registration | typed, each with the same hint | Typed (unchanged), one shared hint on the first, unique check kept | The four hints cost about 85 px | none |

| 26 | Added on (hidden) | does not exist | **New hidden field**, filled automatically with the date and time when a car is **created** and never changed by edits. Becomes the list's default sort (newest first) and a "Recently added" sort option | Fixes "my new car got lost" | new optional key `addedOn`; **existing cars get their real added date from git history** (see clean-up) |

**New field order:** Brand, Model, Year, **Status**, Price, Price on request, Mileage, Gallery Images, Colors, Transmission, Fuel Type, Drive Type, Engine, Doors, Seats, Features, Show on home page, Description, VIN, Chassis, Engine No., Registration.

**Considered and not changed:** typing Brand (kept as a list, but see Open Question 1); a pre-filled "same as last car" template (the CMS has none; **Duplicate** already does this and stays the fastest way to add a similar car); hiding Drive Type behind a default (silent wrong data); collapsing the internal numbers into a group (would change the data shape).

### Brand list and "Recently added": what I verified in the real CMS

- **The brand dropdown is searchable.** A "Filter Options" box sits at the top of every pick-list; typing "mer" reduced 40 brands to one ("Mercedes-Benz"). With your common brands first, they are visible the moment the list opens, so scrolling a long list is not needed.
- **"Added on" behaves correctly:** a new car gets a timestamp; **Duplicate gives the copy a new timestamp** (so a duplicated car lands at the top); **editing a car does not change it**; two cars saved in the same minute tie (harmless, they sort alphabetically).
- **One trap, and the fix:** a car that has no "added on" value gets stamped with the current time the first time it is saved. So before this goes live, all 23 existing cars must be given their real added date (taken from the date each file was first committed to git). Otherwise every old car would jump to the top the first time you flip its status.
- **Also offered, not verifiable here:** the CMS can sort by the Git "last updated" time on the live GitHub connection. I will list it as an extra sort option; its label and behavior can only be confirmed once this is live.
- **Sort menu wording:** the CMS labels a hidden field's sort as "A to Z / Z to A". The default direction (newest first) is what matters; the option is named "Recently added".

### Year list: how it stays current

The list is generated, not hand-edited.
- `config.yml` keeps a static year list (next year back to 2000) for local development.
- At build time a small script rewrites the year options in the deployed `admin/config.yml` from the current date, **newest first: next year → 2000**. The next year is included so a new model can be listed early.
- The schema's maximum year becomes "next year" (computed at build time) instead of the fixed 2030.
- The site rebuilds on every CMS save, so the list refreshes on its own. Optional (ask first): a monthly scheduled rebuild so it also refreshes if nobody saves for a long time.
- Rejected: a hand-edited list plus a failing check every January (breaks the build for the owner without warning).

### Data clean-up needed so existing values stay valid (needs your OK first)

- **Engine:** `'660'` / `660cc` → `660cc`; `'1000'` → `1000cc`; `'1800'` → `1800cc`; `'2000'` → `2000cc`; `1.5L` → `1500cc`; `1.2L` → `1200cc`; `1240 cc` → `1200cc`; `1.5L Turbo` → `1500cc Turbo`; `2.4L Turbo` → `2400cc Turbo`; the empty value is removed.
- **Features:** the four "Japanese vehicles" spellings → one `Japanese Import`; `Leather Interior` → `Leather Seats`; stray entries that repeat other fields (`Black`, `Blue`, `Nissan Xtrail`, `7 Seats`, `Automatic Transmission`) are dropped; the two Jimny highlights (`AllGrip Pro 4WD`, `Brand New (0 km)`) are kept as list options. I will show the complete before/after for every car before running anything.
- **Brand/model:** the Prado becomes brand `Toyota`, model `Land Cruiser Prado` (the file name and URL do not change).
- **Colors:** `Gray` → `Grey` (1 car).
- **Added on:** each existing car gets the date its file was first committed to git (the oldest known date; honest and automatic).

## Tech stack

Astro 7.1.3, Sveltia CMS 0.237.0 (pinned), Zod 4, Node 24 built-in test runner. No new dependencies.

## Commands

```
Check:        npm run check
Content lint: npm run check:content
CMS drift:    npm run check:cms
Tests:        npm test
Build:        npm run build   (astro build, then the sitemap script, then the new CMS-config step)
Dev:          npm run dev     (CMS at http://localhost:4321/admin/index.html)
Validate CMS config against Sveltia's schema:
              npx --yes ajv-cli@5 validate -s <sveltia-cms.json> -d <config.json> --strict=false
```

## Project structure

```
public/admin/config.yml          → the form (source of truth for every pick-list)
scripts/generate-cms-config.cjs  → build step: writes the current year list into dist/admin/config.yml
scripts/one-off/…                → data clean-ups (dry run first, deleted after use)
scripts/check-content.mjs        → gains: every car's value must exist in its CMS pick-list
scripts/check-cms-drift.mjs      → gains: allowlist entries for the fields removed from the form
src/lib/content-schemas.ts       → year max becomes "next year"
src/lib/year-options.ts (+ test) → pure function that builds the year list
```

## Code style

Pick-lists in `config.yml` keep the existing compact style; numbers are saved as numbers:

```yaml
- label: "Doors"
  name: "doors"
  widget: "select"
  options: [2, 3, 4, 5]
  default: 5
  required: false
- label: "Features"
  name: "features"
  widget: "select"
  multiple: true
  required: false
  options: ["Air Conditioning", "Apple CarPlay", "Bluetooth"]
```

## Testing strategy

- **Unit tests** (`node --test`): the year list (newest first, next year → 2000, correct across a year boundary).
- **Content check (new rule):** every value in every car file must appear in its CMS pick-list (brand, year, engine, color name, features, doors, seats). This is what guarantees no existing value is lost; it fails the build if a list option is removed while a car still uses it.
- **Drift check:** keeps passing; fields intentionally left out of the form are listed explicitly.
- **Config validation** against Sveltia's JSON schema.
- **Real-CMS check** (its in-browser test mode, as before): confirm that numbers are saved as numbers (`year: 2021`, `doors: 5`), that existing values show up selected, that a multi-select keeps values it did not offer, that the slug and summary still work with a year *list*, and that the radios fit on a 375 px-wide screen.
- **Measurement:** the same measuring script as the baseline, run again.

## Boundaries

- **Always:** keep stored field names and value shapes unchanged; run all checks before every commit; verify new widgets in the real CMS, not just against the schema.
- **Ask first:** every data change (engine, features, Prado, "Gray"); the optional monthly rebuild in `deploy.yml`; adding or removing a brand/engine/feature option that existing cars use.
- **Never:** rename a stored field; delete an option that an existing car uses; make a currently optional field required.

## Success criteria (measurable)

1. **Typing:** a typical new car (Toyota Aqua 2019, 1500cc, white, 58,000 km, $9,500) needs **at most 20 typed characters** (target: Model, Price and Mileage only), down from about 75.
2. **Update a car:** change the status of an existing car in **at most 3 interactions** (open it, tap the status, Save), with **Status and Price visible on the first screen** of a 390 × 844 phone.
3. **Height:** the form on a phone-width screen is **at most about 2,300 px**, down from about 2,800 (roughly 18% shorter). I will report the measured number, whatever it is; the larger gains are in typing and data quality, not height.
4. **Consistency:** after the clean-up, every car passes the new content check; engine has no more than ~20 distinct values (down from 14 spellings of the same few sizes), and features come only from the pick-list.
5. **Nothing breaks:** `astro check`, `check:content`, `check:cms`, tests and the build all pass; vehicle pages, the sitemap and `/app` data are unchanged except for the corrected values.
6. **Year list:** the generated list always runs from next year to 2000, newest first, and is the same list the schema accepts.
7. **New car is never lost:** after saving a new car (or duplicating one), the list opens with it **first within its status group, without scrolling**; the Sort menu offers "Recently added"; editing a car does not move it; an existing car edited for the first time keeps its original added date.
8. **Brand pick:** your six most-sold brands are visible without scrolling when the brand list opens (the open list shows about six rows on a phone-height screen), and typing 3 letters leaves at most 3 matches.

## Decisions (all open questions answered)

1. **Brand:** pick-list, ordered by frequency, searchable. Confirmed.
2. **Seats:** 2 · 4 · 5 · 7 · 8 · 12 as proposed (accepted).
3. **Body Type and Currency:** removed from the form (accepted).
4. **Features list:** I propose about 25 entries from your own data plus common ones; you review it in the plan (accepted).
5. **Data clean-up:** I show the complete before/after for each change, and run it only after your OK (accepted).
6. **Monthly automatic rebuild:** included (accepted); this edits the deploy workflow, so it is its own small task.
