# Task List: Faster, Shorter Vehicle Form

Rule for every task: finish with `npm run check`, `npm run check:content`, `npm run check:cms`,
`npm test` and `npm run build` all green, verify any form change in the real CMS (its in-browser test
mode), then one commit. Commit messages end with the `Co-Authored-By` line from the session.

## Phase A: Guard and "recently added"

- [x] **V1: Guard check: stored values must exist in the CMS pick-list** (S)
  - Description: Extend `scripts/check-content.mjs` so that for every vehicle field that the CMS renders as
    a `select` (including `colors[].name`, and multi-select `features`), each value in each car file must
    be one of that field's options in `public/admin/config.yml`. Pure helper in `src/lib/` with unit tests.
  - Acceptance: passes today (few selects exist); fails when a car uses a value its list does not offer;
    names the car, the field and the value.
  - Verify: `npm test`; `npm run check:content`; break it on purpose with a temporary bad value.
  - Files: `scripts/check-content.mjs`, `src/lib/cms-options.ts`, `src/lib/cms-options.test.ts`
  - Depends on: none

- [x] **V2: "Recently added": hidden timestamp and default sort** (M) (adds one optional schema key)
  - Description: Add optional `addedOn` to the vehicle schema; add a hidden field `addedOn` with
    `default: "{{datetime}}"`; make it the default sort (newest first, labelled "Recently added") and add
    `commit_date` as an extra "last updated" sort; keep year, price, mileage, status and brand as other sorts.
  - Acceptance: a new car gets a timestamp; Duplicate gets a new one; editing keeps it; the list opens
    newest first; the schema and lint accept the key; existing cars still build.
  - Verify: real-CMS test (create, duplicate, edit; read the saved file); build.
  - Files: `public/admin/config.yml`, `src/lib/content-schemas.ts`
  - Depends on: none

- [ ] **V2b: Backfill "added on" for the 23 existing cars** (S) (data change: needs your OK)
  - Description: One-off script that reads each car file's first git commit date and writes `addedOn`.
    Dry run prints a table (car, date). **STOP and show it to you before writing.**
  - Acceptance: all 23 cars have `addedOn`; first-time edits no longer move a car; build identical apart
    from the new key.
  - Verify: dry-run table reviewed; `check:content`; build; page output unchanged.
  - Files: `scripts/one-off/backfill-added-on.mjs` (deleted after), 23 content files
  - Depends on: V2

### Checkpoint A
- [x] V2 verified in the real CMS (a new or duplicated car is first in its group; status edits keep its date).
- [ ] **Waiting on you: OK to run V2b** (dry-run table shown: 23 cars, dates from git history).
- [ ] All checks green. In the real CMS: the new car is first in its group; "Recently added" appears in
      the Sort menu. **Review with you.**

## Phase B: Year list and the compact pass

- [x] **V3: Year pick-list, always current** (M)
  - Description: Pure `yearOptions(date)` (next year down to 2000, newest first) with tests;
    `scripts/generate-cms-config.cjs` rewrites the year options in `dist/admin/config.yml` after the build
    (fails if its markers are missing); `build` script runs it; the schema's year maximum becomes next year;
    `config.yml` gets the year `select` with a static fallback list for local dev.
  - Acceptance: the deployed config's list tops out at next year; `year` is saved as a number; the slug
    (`brand-model-year`) and the list summary "(2021)" still work with a select.
  - Verify: unit tests (including a year boundary); build then read `dist/admin/config.yml`; real-CMS test.
  - Files: `src/lib/year-options.ts`, `src/lib/year-options.test.ts`, `scripts/generate-cms-config.cjs`,
    `package.json`, `public/admin/config.yml` (+ `src/lib/content-schemas.ts`)
  - Depends on: V1

- [x] **V4: Compact pass: radios, fewer fields, better order, shorter hints** (M)
  - Description: Doors radios 2/3/4/5 (default 5) and Seats radios 2/4/5/7/8/12 (default 5); remove
    Currency, Body Type and the color swatch picker from the form (they stay in the schema; add them to the
    drift check's "intentionally not in the form" list); new field order with Status directly after Year;
    "Featured" relabelled "Show on home page" and moved down; Description shortened (`minimal`, fewer
    buttons); trim hints (one shared note for the four internal numbers).
  - Acceptance: doors and seats save as numbers; each is one short row; Status and Price are on the first
    screen of a 390 x 844 phone; radios fit at 375 px.
  - Verify: `check:cms`; real-CMS test at phone width; measuring script: record height and field count.
  - Files: `public/admin/config.yml`, `scripts/check-cms-drift.mjs`
  - Depends on: V2

### Checkpoint B
- [x] Measured in the real CMS, like for like: at 390 px wide the form went from **3,262 px to 2,732 px
      (-16%)** and from 24 fields to 22; at 433 px wide from about 2,834 px to about 2,394 px (-15%).
      Status and Price are on the first screen of a 390 x 844 phone. Doors (2 3 4 5) and Seats
      (2 4 5 7 8 12) are single rows with 5 preselected. "Upcoming" wraps to a second line in the
      Status radios at 390 px.
- [ ] **Review with you** (touch targets, order, hints).

## Phase C: Pick-lists for the typed fields (each ends with a data gate)

> Dry run prepared for V5-V8 in `scripts/one-off/normalize-vehicle-values.mjs` (31 changes in 22 of 23
> cars; nothing written). **Waiting on your OK** before the lists are added to the form and the data is
> normalized.

- [ ] **V5: Color name list (+ "Gray" to "Grey")** (S) (data change: 1 car, needs your OK)
  - Description: Select with the 17 color names; hex stays automatic. Fix the one `Gray`.
  - Acceptance: every existing color is in the list; the color filter and swatches are unchanged.
  - Verify: `check:content` (V1 guard); build; page output unchanged except that car.
  - Files: `public/admin/config.yml`, 1 content file
  - Depends on: V1, V4

- [ ] **V6: Engine list + normalization** (M) (data change: needs your OK)
  - Description: Select with the 20 engine sizes, optional. One-off script maps the 14 spellings
    (`'660'`, `660cc`, `1.5L`, `1240 cc`, `2.4L Turbo`, empty …) to list values. **STOP: show the before/after for
    every car.**
  - Acceptance: every car's engine is a list value or empty; pages show the same sizes in the same format.
  - Verify: dry-run table reviewed; V1 guard; build; compare engine text on built pages.
  - Files: `public/admin/config.yml`, `scripts/one-off/normalize-engine.mjs` (deleted after), content files
  - Depends on: V5

- [ ] **V7: Features multi-select + normalization** (M) (data change: needs your OK)
  - Description: **First a real-CMS spike:** does a multi-select keep a stored value that is not in its list?
    Then a multi-select with the 26 features (dropdown, not a wall of checkboxes). One-off script maps
    "Japanese vehicles" (4 spellings) to "Japanese Import", "Leather Interior" to "Leather Seats", and
    drops the stray entries (Black, Blue, Nissan Xtrail, 7 Seats, Automatic Transmission). **STOP: show
    the before/after for every car.**
  - Acceptance: every car's features are all in the list; no data loss beyond the approved drops.
  - Verify: spike result noted; V1 guard; build; vehicle pages and `llms-full.txt` reviewed.
  - Files: `public/admin/config.yml`, `scripts/one-off/normalize-features.mjs` (deleted after), content files
  - Depends on: V6

- [ ] **V8: Brand list + the Prado fix** (M) (data change: 1 car, needs your OK)
  - Description: Select with the ~40 brands, frequency-ordered, searchable. Prado becomes brand `Toyota`,
    model `Land Cruiser Prado` (file name and URL unchanged).
  - Acceptance: your six most-sold brands show without scrolling when the list opens; typing 3 letters
    leaves at most 3 matches; slug and title use the chosen brand.
  - Verify: real-CMS test of the open list and the filter box; V1 guard; build; Prado page title.
  - Files: `public/admin/config.yml`, 1 content file
  - Depends on: V7

### Checkpoint C
- [ ] Add a typical new car end to end in the real CMS and count typed characters (target: 20 or fewer).
      **Review with you.**

## Phase D: Keep it fresh and report

- [ ] **V9: Monthly automatic rebuild** (XS) (edits the deploy workflow: needs your OK)
  - Description: Add a monthly `schedule` trigger to `.github/workflows/deploy.yml` so the generated year
    list refreshes even if nobody saves for a long time.
  - Acceptance: the workflow still runs on push; a scheduled run is configured.
  - Verify: YAML review; it cannot be run here (GitHub Actions).
  - Files: `.github/workflows/deploy.yml`
  - Depends on: V3

- [ ] **V10: Final measurement and report** (S)
  - Description: Re-run the baseline measurement and typing count, fill in the spec's success criteria
    with real numbers (including any criterion that was missed), tidy the task lists.
  - Acceptance: every success criterion in the spec has a measured result next to it.
  - Verify: the measuring script's output is pasted into the spec.
  - Files: `SPEC-vehicle-form.md`, `tasks/todo-vehicle-form.md`
  - Depends on: V8, V9
