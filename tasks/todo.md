# Task List

Rule for every task: finish with `npm run check` (0 errors) and `npm run build` green, then one
commit. Commit messages end with the `Co-Authored-By` line from the session.

## Phase 0 — Guard rails

- [x] **T1: Pin the CMS script** (XS)
  - Acceptance: `public/admin/index.html` loads `@sveltia/cms@0.237.0`; no unversioned URL left.
  - Verify: `grep sveltia-cms public/admin/index.html`; open `/admin/index.html` in `npm run dev`;
    login screen renders, console has no errors.
  - Files: `public/admin/index.html`
  - Depends on: none

- [x] **T2: CI gate** (XS) — needs your nod (edits `deploy.yml`)
  - Acceptance: the build job runs `npm run check` before `npm run build`; a type error blocks deploy.
  - Verify: push a branch with a deliberate type error → job fails; revert it.
  - Files: `.github/workflows/deploy.yml`
  - Depends on: none

- [x] **T3: Make Prettier work** (XS) — needs your nod (devDependency)
  - Acceptance: `prettier-plugin-astro` installed; `npx prettier --check` runs without a
    "plugin not found" error. The whole of `src/` is NOT reformatted.
  - Verify: `npx prettier --check src/lib/seo.ts`
  - Files: `package.json`, `package-lock.json`
  - Depends on: none

### Checkpoint 0
- [x] `npm run check`, `npm run build` green; admin page loads pinned CMS. Review with you.

## Phase 1 — CMS ⇄ schema parity

- [x] **T4: Strip dead keys from vehicle files** (S)
  - Description: 7 vehicle files carried a `title:` and/or `slug:` key (11 lines in total). Zod ignores `title`;
    `slug` is overridden by the file name. Remove them with a one-off script.
  - Acceptance: no `title:` or `slug:` line in any `src/content/vehicles/*.md`; rendered
    `<title>` of every vehicle page is byte-identical to before.
  - Verify: build; diff `dist/vehicles/*/index.html` titles against a saved copy from before;
    `git diff --stat` shows only front-matter line removals.
  - Files: `scripts/one-off/strip-vehicle-dead-keys.mjs` (deleted after run), 11 content files
  - Depends on: none

- [x] **T5: Vehicle CMS ⇄ Zod parity + shared schema** (M)
  - Description: Spike first (does `astro/zod` import in plain Node?). Move the vehicle shape to
    `src/lib/content-schemas.ts`, make it `.strict()`, import it in `content.config.ts`.
    In `config.yml` remove `Title`/hidden `Slug`, set `slug: "{{brand}}-{{model}}-{{year}}"`,
    `identifier_field: model`, add `priceOnRequest`, `bodyType`; drop the unused `colorHex`, `registrationYear`,
    `slug`, `lang`, `seo` (nothing reads them). Also fixed `mazda-2.md` (`model: '2021'`). Add global `output.omit_empty_optional_fields: true`.
  - Acceptance: every vehicle field in `config.yml` has a same-named Zod key and vice versa;
    unknown keys fail the build; new entry would be written to `brand-model-year.md`.
  - Verify: `npm run build`; temporarily add `foo: 1` to one vehicle → build fails; remove it.
  - Files: `src/lib/content-schemas.ts` (new), `src/content.config.ts`, `public/admin/config.yml`
  - Depends on: T4

- [x] **T6: Fix the other drift** (S)
  - Description: Gallery `href` (unused, remove from CMS); Site Settings gains `lat`, `lng`,
    `tiktok`, `foundingYear`, `priceRange` to match Zod; add "Upcoming" where status is listed.
  - Acceptance: no field exists in only one of `config.yml` / `content.config.ts` for gallery and
    site-settings.
  - Verify: `npm run build`; T7 drift check (once it exists) passes.
  - Files: `public/admin/config.yml`, `src/content/gallery/*.md` (only if they contain `href`)
  - Depends on: T5

- [x] **T7: Content lint + CMS drift check** (M) — needs your nod (`yaml` devDependency)
  - Description: `scripts/check-content.mjs` — vehicle keys valid, `model` is not a year, no two
    vehicles share a rendered title (`brand model year`), at least one photo. `scripts/check-cms-drift.mjs`
    — compares `config.yml` field names to Zod keys per collection. npm scripts `check:content`,
    `check:cms`; wired into CI after build.
  - Acceptance: both pass on the repo; each fails on a deliberately broken input (year in `model`;
    extra CMS field).
  - Verify: run both, then break each rule once and confirm exit code 1.
  - Files: `scripts/check-content.mjs`, `scripts/check-cms-drift.mjs`, `package.json`,
    `.github/workflows/deploy.yml`
  - Depends on: T5, T6
  - Done: warns (does not fail) on duplicate titles involving a Sold car; see `suzuki-swift-2022.md`.

### Checkpoint 1
- [x] check + build + both scripts green; CMS config validates against the official JSON schema
      (`npx --yes ajv-cli validate`). Review with you.

## Phase 2 — Fast add/update

- [x] **T8: Vehicle form ergonomics** (M)
  - Description: Field order by edit frequency; `summary`; thumbnail from first photo;
    `sortable_fields` (default year ↓; price, mileage, status); `view_filters` (Hide sold,
    Featured, Price on request, Missing photos via `empty`); `view_groups` (default Status, then
    Brand; Sveltia filters are AND-combined checkboxes, so exclusive statuses are a grouping); `slug` object with `editable: [create]`; radio buttons for
    status/transmission; `unique: true` on VIN, chassis number, registration number; `step: -1`
    and `$` label on price; "Internal — used for quotations/invoices" group by order + hint;
    `editor.preview: false`; keep `duplicate`.
  - Acceptance: config validates; in the CMS the list opens grouped by status, sorted newest year first,
    shows thumbnails; a new entry needs only brand, model, year, price, status, mileage, photos.
  - Verify: ajv validation; manual smoke test in Chrome with the **local repository** mode.
  - Files: `public/admin/config.yml`
  - Depends on: T5

- [x] **T9: Photo handling** (S)
  - Description: Image field `filename_template: "{{slug}}-{{uuid_shorter}}"`, `min: 1`, `max: 20`;
    folder `Cars/{{slug}}` (the old `Cars/{{year}}` was the upload year, not the car's year).
    Dropped after testing: a separate `heic` rule (covered by `raster_image`) and an
    `asset_collections` entry (showed 0 for per-car subfolders; the "Vehicles" group works).
  - Acceptance: an iPhone HEIC upload ends as `brand-model-year-xxxxxxxx.webp` under
    `public/images/Cars/<slug>/`, no GPS, ≤ 5 MB; entry cannot be saved with zero photos.
  - Verify: ajv validation; smoke test with one HEIC and one JPEG in local mode, then delete the test entry.
  - Files: `public/admin/config.yml`
  - Depends on: T8 (same file; sequence, do not parallelize)

### Checkpoint 2
- [x] Verified by me in the real CMS via its test backend: config loads with no validation errors;
      field order, radios, defaults; Model-is-a-year guard; slug `toyota-roomy-2021`; summary
      "(2021)"; default grouping and sort; "Hide sold"; Duplicate; a 4032x3024 JPEG saved as
      `/images/Cars/toyota-alto-2021/toyota-alto-2021-e8a4f23d.webp`; HEIC/HEIF accepted.
- [ ] Still needs you, in real GitHub or local-repository mode: one real iPhone HEIC photo upload,
      then delete the test entry. Review with you.

## Phase 2c — Multi-color vehicles

- [ ] **T10: Colors data model + resolver + tests** (M)
  - Description: Add `colors` to the shared vehicle schema (name, optional `hex`, optional `units`,
    `images`). `src/lib/vehicle-colors.ts`: `colorSlug`, `hexFor(name)` (built-in lookup for common
    names), `resolveColors(vehicle)` (legacy `color` fallback), `resolveGallery(vehicle, colorName)`
    (color photos then shared photos; unknown color → default). `node:test` tests. Extend the
    content lint: unique color names, valid hex, ≥1 photo (own or shared).
  - Acceptance: tests cover color with photos, without photos, unknown color, legacy `color`, no
    colors; `npm test` passes; existing vehicles unaffected.
  - Verify: `npm test`, `npm run build`, `npm run check:content`.
  - Files: `src/lib/content-schemas.ts`, `src/lib/vehicle-colors.ts`,
    `src/lib/vehicle-colors.test.ts`, `scripts/check-content.mjs`, `package.json`
  - Depends on: T5, T7

- [ ] **T11: CMS colors list + migration script** (S)
  - Description: `colors` list in the vehicle form (`summary: "{{name}}"`, `thumbnail: images`,
    `collapsed: true`, `label_singular: "Color"`, `allow_reorder: true`, hex via color widget,
    `units` number min 0, `images` multiple). Old `color` text field removed from the form after
    the script exists. Write `scripts/one-off/migrate-colors.mjs` (idempotent; maps `color: X` to
    `colors: [{name: X}]`; keeps `images` as shared).
  - Acceptance: config validates; script dry-run prints the planned changes for all 22 files.
  - Verify: ajv validation; `node scripts/one-off/migrate-colors.mjs --dry-run`.
  - Files: `public/admin/config.yml`, `scripts/one-off/migrate-colors.mjs`
  - Depends on: T10

- [ ] **T12: Run the migration** (S)
  - Acceptance: every vehicle has `colors`; legacy `color` line removed; pages render the same
    swatch name as before; one commit that can be reverted alone.
  - Verify: build; compare `dist` vehicle pages before/after (only the color text may differ in
    markup); `npm run check:content`.
  - Files: ~22 content files (mechanical, from the script)
  - Depends on: T11

- [ ] **T13: Vehicle page color picker + gallery** (M)
  - Description: `VehicleGallery.astro` + `ColorPicker.astro`. Server-renders the default color's
    gallery; `role="radiogroup"` swatches with visible names, arrow-key support, 44px targets;
    sold-out (`units: 0`) colors struck through; clickable thumbnails; swap script with
    `?color=` deep link (read on load, written on change via `history.replaceState`); WhatsApp
    message/link includes the color; fixed 4:3 container; `prefers-reduced-motion` honored.
  - Acceptance: with JS off the default gallery shows; choosing White shows White photos;
    `?color=white` opens on White; no layout shift; keyboard operable; canonical unchanged.
  - Verify: `preview_start` + read_page + click swatches + check console; resize to mobile;
    view source with JS disabled.
  - Files: `src/components/VehicleGallery.astro`, `src/components/ColorPicker.astro`,
    `src/pages/vehicles/[...slug].astro`, `src/styles/utilities.css`
  - Depends on: T12

- [ ] **T14: Listing cards + color filter** (M)
  - Description: `VehicleCard.astro` shows color dots and uses the default color's cover image;
    `vehicles.astro` adds a Color filter group (names from data), `data-colors` on cards, URL-
    parameter aware like the existing filters.
  - Acceptance: filtering by a color shows every vehicle that lists it; "All" resets;
    card cover = first color's first photo, else first shared photo.
  - Verify: preview; filter by two different colors; `npm run build`.
  - Files: `src/components/VehicleCard.astro`, `src/pages/vehicles.astro`
  - Depends on: T12 (parallel with T13, T15)

- [ ] **T15: Structured data for colors** (S)
  - Description: `schema.ts` `vehicleSchema`: `color` as an array of names, `image` as the union
    of all colors' and shared photos (absolute URLs); keep one `Offer`.
  - Acceptance: JSON-LD of a 3-color car lists 3 colors and all photos; single-color car unchanged.
  - Verify: build; parse JSON-LD from `dist`.
  - Files: `src/lib/schema.ts`, `src/pages/vehicles/[...slug].astro`, `src/pages/new-car-launch.astro`
  - Depends on: T12 (parallel with T13, T14)

### Checkpoint 3
- [ ] Create a real multi-color test vehicle in local-repo CMS mode (3 colors, own photos), verify
      picker, deep link, filter, JSON-LD, then delete it. check + build + tests + lint green.
      Review with you.

## Phase 3 — Trim the backend

- [ ] **T16: Hide and lock collections** (S)
  - Description: `hide: true` on Pages, FAQ, Navigation, Footer; `create: false, delete: false` on
    Services and Team; Site Settings becomes a singleton. Spike: confirm `hide` is valid on file
    collections in the 0.237.0 schema; if not, use the supported equivalent.
  - Acceptance: CMS sidebar shows Vehicles, Gallery, Testimonials, TikTok, Instagram, Blog, Site
    Settings (+ Services/Team without Add/Delete); all content files untouched.
  - Verify: ajv validation; smoke test; `git diff --stat` touches only `config.yml`.
  - Files: `public/admin/config.yml`
  - Depends on: T8

### Checkpoint (Phase 3)
- [ ] Review the CMS sidebar with you.

## Phase 4 — `/app`

- [ ] **T17: `/app/vehicles.json` endpoint** (S)
  - Description: Static endpoint listing every vehicle with identifiers, colors and price for the
    quote/invoice tools. Path is already `Disallow`ed; not in the sitemap.
  - Acceptance: `dist/app/vehicles.json` exists and contains VIN/chassis/engine/registration and
    colors; not referenced by any public page; sitemap unchanged.
  - Verify: build; `jq 'length' dist/app/vehicles.json`; grep sitemap.
  - Files: `src/pages/app/vehicles.json.ts`
  - Depends on: T12

- [ ] **T18: Vehicle picker in quotations** (M)
  - Description: Shared helper `src/lib/app-vehicles.ts` (load JSON, search, color choice).
    `quotations/new.astro` gets a picker, accepts `?v=<slug>`, asks "Which color?", prefills
    identifiers and color.
  - Acceptance: picking a car fills brand, model, year, price, color, VIN, chassis, engine,
    registration; manual entry still works when no vehicle is chosen.
  - Verify: login to `/app`, create a quotation from the picker; open the saved document.
  - Files: `src/lib/app-vehicles.ts`, `src/pages/app/quotations/new.astro`
  - Depends on: T17

- [ ] **T19: Vehicle picker in invoices** (S)
  - Acceptance and verify: same as T18 for `invoices/new.astro`; "Name Transfer" default item
    still added when a vehicle is chosen.
  - Files: `src/pages/app/invoices/new.astro`
  - Depends on: T18

- [ ] **T20: Stop publishing identifiers** (S) — needs your nod
  - Description: Remove `data-vehicle`/`vehicleJson` and the `?vehicle=` links from the public
    vehicle page and `VehicleCard.astro`; admin buttons link to `?v=<slug>` instead.
  - Acceptance: `grep -ri "chassis\|vin\b" dist/vehicles` finds nothing; admin buttons still open
    the picker prefilled.
  - Verify: build + grep; manual click-through after login.
  - Files: `src/pages/vehicles/[...slug].astro`, `src/components/VehicleCard.astro`
  - Depends on: T18, T19

- [ ] **T21 (optional): Hash the `/app` password** (S) — needs a new password from you
  - Description: Store a SHA-256 hash (Web Crypto), compare on login. This does not make the gate
    secure (client-side, public repo); it only stops the plain password sitting in source.
  - Acceptance: login works with the new password; old plaintext constant gone.
  - Files: `src/lib/auth.ts`, `src/pages/app/index.astro`
  - Depends on: none

- [ ] **T22 (optional): Backup/restore for quotations and invoices** (M)
  - Description: Export/import of the `localStorage` documents as one JSON file.
  - Acceptance: export, clear storage, import → identical list and counters.
  - Files: `src/lib/documents.ts`, `src/pages/app/index.astro`
  - Depends on: none

### Checkpoint 4 — Complete
- [ ] All SPEC.md success criteria met; `npm run check`, `npm run build`, `npm test`,
      `npm run check:content`, `npm run check:cms` green; sitemap still excludes `/app/*` and sold
      cars; Sveltia pinned at 0.237.0.
- [ ] Remind: revoke the access token pasted into chat earlier.
- [ ] Phase 5 (OAuth via Cloudflare Worker) stays deferred.

## Found while implementing (not in the original plan)

- **The owner edits through the live CMS** (10 commits on `origin/main` from 31 Aug and 24 Sep:
  status flips, price/mileage changes, a copied car). Merged into local `main` without conflicts.
  Typical weekly edits: status, price, mileage, add a car by copying another.
- **Stale-save hazard fixed:** the old live form writes `title:`; the strict schema would have
  failed the production build on the owner's next save. `title`/`slug` are now tolerated
  (ignored) and `check:content` warns; every other unknown key still fails.
- **Data questions for the owner** (reported as lint warnings, not guessed): `suzuki-swift-2022.md`
  (year 2021) and `toyota-raize-2022.md` (year 2021, no photos) duplicate their 2021 twins; both
  are Sold.
