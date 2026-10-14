# Spec: Ashaz Autoz — Simpler CMS, Safer Content Pipeline

Status: DRAFT for review. No implementation has started.

## Objective

Make adding and updating vehicles fast and hard to get wrong, and shrink the CMS to the content
that actually changes often.

**Users:** the Ashaz Autoz owner/staff editing content in Sveltia CMS (`/admin/`), and developers
maintaining the Astro site.

**Why:** the CMS form and the Zod content schema have drifted apart. That caused six vehicle pages
to ship with `model: '2021'` and a dropped `title` field (duplicate `<title>` tags, fixed manually in
commit `4b40874`). Several CMS collections (Pages, FAQ) change nothing on the live site, and the CMS
script loads an unpinned `latest` build.

**Success looks like:** an editor can add a car in under 2 minutes, mark it Sold in 3 clicks, and
cannot save a vehicle that would produce a broken page.

## Assumptions (correct me now or I proceed with these)

1. Hosting stays GitHub Pages; every CMS save is a commit that rebuilds the site via `deploy.yml`.
2. The repo `irfatech/ashaz-autoz` is **public** (verified: unauthenticated API returns 200).
3. Editors each have a GitHub account with write access to the repo.
4. Fields editors change weekly: price, status, mileage, photos, featured.
5. **Decided:** Pages, FAQ, Navigation and Footer are hidden from the CMS, not deleted.
6. **Decided:** `/app` stays in this repo as a convenience tool, not a security boundary.
7. Sveltia CMS version: always the newest (the script is deliberately not pinned); the checks validate the config against the 0.237.0 schema.
8. **Decided:** sign-in stays on the built-in access token. OAuth is deferred until the Cloudflare
   infrastructure decision is made.
9. **Decided:** VIN, chassis, engine and registration numbers stay in the vehicle form so invoices
   prefill them. The change is where they are used, not whether they are stored (see Phase 4).

## Tech Stack

Astro 7.1.3 (static) · TypeScript 6 strict · Tailwind 4.3.3 · `@astrojs/mdx` 7.0.3 ·
`@astrojs/sitemap` 3.7.3 · Sveltia CMS 0.237.0 (GitHub backend) · Node 24 · GitHub Actions → Pages.

## Commands

```
Dev:       npm run dev            (CMS at http://localhost:4321/admin/index.html)
Check:     npm run check          (astro check — must report 0 errors)
Build:     npm run build          (astro build && node scripts/generate-sitemaps.cjs)
Preview:   npm run preview
Format:    npx prettier --write src/ public/admin/config.yml
```

## Project Structure

```
public/admin/config.yml     → Sveltia CMS config (collections, fields, slugs, views)
public/admin/index.html     → loads the CMS script (to be version-pinned)
src/content.config.ts       → Zod schemas — the source of truth for content shape
src/content/vehicles/*.md   → one file per vehicle; filename = URL slug
src/lib/schema.ts           → JSON-LD builders
src/pages/app/*             → private quotation/invoice tool (noindex, disallowed)
scripts/generate-sitemaps.cjs → splits the sitemap, deletes the raw one
.github/workflows/deploy.yml  → build + deploy (gets a check gate)
```

## Code Style

Prettier: 2 spaces, double quotes, semicolons, trailing commas, 100 columns. Content files use
simple flat YAML front matter. One CMS field per Zod key, same name, same type:

```yaml
# config.yml                                  // content.config.ts
- { name: "price", widget: "number",          price: z.coerce.number().int().min(0),
    value_type: "int", min: 0 }
```

## Testing Strategy

There are no tests today. Keep it light and cheap:

- **CI gate:** `npm run check` + `npm run build` must pass before the deploy job runs.
- **Content lint (new, ~40 lines, Node script):** every `src/content/vehicles/*.md` has only keys
  the Zod schema declares, `model` is not a 4-digit year, and no two vehicles share a rendered
  `<title>`. Runs in CI after build.
- **Config drift check (new):** a script compares field `name`s in `config.yml` against the Zod
  schema keys per collection and fails on a mismatch.
- No browser/E2E suite in this scope. Manual CMS smoke test is listed in Success Criteria.

## Boundaries

- **Always:** run `npm run check && npm run build` before committing; keep CMS field names identical
  to Zod keys; the CMS script follows the newest Sveltia release on purpose (the owner's decision, so upstream fixes arrive without a code change); `admin/index.html` carries a small, removable stylesheet for the iPhone photo-list bug.
- **Ask first:** adding npm dependencies; changing `deploy.yml`; renaming any vehicle file that is
  linked from a page (e.g. `suzuki.md` is hardcoded at `index.astro:134`); changing hosting or auth.
- **Never:** commit tokens or client secrets (an access token was pasted into chat earlier —
  revoke it); delete content files without approval; weaken `astro check` or the sitemap filters.

## Plan Summary (phased, each phase independently shippable)

**Phase 0 — Guard rails (no behaviour change).** Pin the CMS script to `0.237.0` in
`admin/index.html`. Add the CI gate. Install `prettier-plugin-astro` (referenced in `.prettierrc`
but not installed).

**Phase 1 — CMS ⇄ schema parity.**
- Vehicles: drop `Title` and hidden `Slug`; `slug: "{{brand}}-{{model}}-{{year}}"`;
  `identifier_field: model`; add `priceOnRequest`, `bodyType`. `registrationYear`, `slug`, `lang`, `seo` are dropped (nothing reads them). The unused
  `colorHex` field is dropped; colors are handled by the `colors` list in Phase 2c.
- `output.omit_empty_optional_fields: true`.
- Fix drift elsewhere: gallery `href`; site settings `lat`, `lng`, `tiktok`, `foundingYear`,
  `priceRange`; add "Upcoming" to status filters.
- Make the Zod vehicle schema reject unknown keys; add the content-lint and drift-check scripts.

**Phase 2 — Fast vehicle add/update.**
- Field order by edit frequency: Brand, Model, Year, Price, Status, Mileage, Images, then the rest.
- `summary: "{{brand}} {{model}} ({{year}}) · {{status}}"`; list thumbnail from first image.
- `sortable_fields` (default year descending; price, mileage, status).
- `view_filters`: Available / Upcoming / Reserved / Sold / Featured; `view_groups`: status, brand.
- Radio buttons for status and transmission; `unique: true` on registration number; `step: -1` and a
  `$` label on price; `filename_template: "{{slug}}-{{uuid_short}}"` for uploaded photos.
- Keep `duplicate` enabled so a similar car can be cloned.
- Collection features that did not exist (or were not used) when this config was written:
  - `slug` object form with `editable: [create]`: an editor can adjust the URL slug when creating a
    vehicle but cannot rename it later and break the live URL.
  - `view_filters` extended form with a `default` filter (open on "Available"), plus the `empty`
    option: a "Missing photos" filter (`field: images, empty: true`) and a "Missing price" filter.
  - `sortable_fields` with a `default` sort; entries with no value sort last (v0.234).
  - `unique: true` (v0.237) on VIN, chassis number and registration number, so a car cannot be
    entered twice by mistake.
  - Optional (Ask first, adds a field): Number `auto_increment` (v0.237) for a `stockNo`, which
    could be printed on quotations and invoices.
  - `singletons` for Site Settings in place of the one-file "files" collection.
  - `editor.preview: false`, since the CMS preview pane cannot render this Astro site anyway.

**Phase 2b — Media: car photos.** Currently set: WebP, quality 82, max width 2048, 5 MB limit,
`slugify_filename`, per-year folders. Not yet used:
- `filename_template: "{{slug}}-{{uuid_shorter}}"` on the vehicle image field. Photos are renamed on
  save to e.g. `toyota-roomy-2021-a1b2c3d4.webp` instead of `img_6618.webp` or a bare UUID. This
  helps image search and makes `public/images` readable.
- HEIC support: iPhone photos are converted in the browser to WebP. Add a `heic` transformation key
  (width 1600) so phone photos are not larger than needed. Only needed if a CSP is ever added:
  `blob:` in `worker-src`.
- Exif is stripped automatically on upload, so GPS location in phone photos is not published.
- `min: 1, max: 20` on the vehicle images field, so a car cannot be saved without a cover photo.
- Upload workflow on a phone: Sveltia is mobile-friendly and supports drag-and-drop and a global
  Quick Add (`+`) button; entries are auto-backed-up while editing.
- Asset Library: `asset_collections` can expose `public/images/Cars` as its own browsable folder
  for finding and renaming photos outside an entry.
- Out of scope, noted for later (Ask first): per-vehicle page-bundle folders
  (`path: "{{slug}}/index"`, `media_folder: ""`) would let Astro generate responsive image sizes,
  but it changes every vehicle's content id and image path.
- Template-generated alt text (`"{{brand}} {{model}} {{year}} – photo 2"`) in the vehicle page
  instead of the current empty `alt=""` on gallery thumbnails. This is a code change, not CMS.
- Stock photo providers (Pexels, Pixabay, Unsplash) exist in the CMS; irrelevant for vehicles,
  possibly useful for blog posts. Leave off unless wanted.

**Phase 2c — Multi-color vehicles (one entry, many colors).** One Alto entry lists every color it
comes in; each color can carry its own photos; the visitor picks a color and the gallery changes.

*Data model* (additive; existing entries keep working untouched):
```yaml
colors:
  - name: Black
    hex: "#111111"      # optional; common names fall back to a built-in lookup
    units: 2            # optional; blank = in stock, 0 = sold out, n = "n available"
    images: [/images/Cars/2021/alto-black-a1b2c3d4.webp, ...]   # this color's photos
  - name: White
    images: [...]
images: [...]            # SHARED photos (interior, engine) shown for every color
```
- Zod: `colors: z.array(z.object({ name, hex?: /^#[0-9a-f]{6}$/i, units?: int>=0, images: string[] }))
  .default([])`. The old single `color: "Silver"` string stays valid as a fallback: no `colors` →
  one swatch from `color`, no per-color photos. A one-off script converts the 22 existing vehicles.
- Gallery for the selected color = that color's photos, then the shared `images`. If a color has no
  photos it shows the shared set. The first color in the list is the default and sets the cover
  image on listing cards.

*CMS (Sveltia List field, all options verified in the 0.237.0 schema):* `widget: list` with
`fields: [name, hex (color widget), units (number, min 0), images (image, multiple)]`,
`summary: "{{name}}"`, `thumbnail: images`, `collapsed: true`, `label_singular: "Color"`,
`allow_reorder: true` (drag to choose the default color). `required: false` so a one-color car is
still one click.

*Front end:*
- Vehicle page: accessible swatch picker (`role="radiogroup"`, visible color name, not color-only,
  44px touch targets, keyboard arrows); clicking a swatch swaps the main image and thumbnails.
  Thumbnails become clickable (today the page shows one big image plus 4 static thumbnails with
  no click behaviour). Sold-out colors are struck through and not selectable.
- `?color=black` deep link selects that color on load; the canonical URL stays the single vehicle
  URL, so colors never create duplicate indexable pages. The server-rendered HTML contains the
  default color's gallery, so it works without JavaScript.
- The WhatsApp enquiry link and the "Call" text include the chosen color ("…Toyota Alto (2021) –
  White…"). Listing cards show small color dots and `/vehicles` can filter by color.
- Honors `prefers-reduced-motion`; image swap uses the fixed 4:3 container, so no layout shift.
- JSON-LD: `color` becomes an array of names; `image` lists every color's photos; offers stay one
  per vehicle (per-color offers are out of scope).
- `/app/vehicles.json` carries `colors`; the quotation/invoice vehicle picker also asks "Which
  color?" and prefills it.

*Tests:* a pure function `resolveGallery(vehicle, colorName)` is covered with Node's built-in
`node:test` (no new dependency): color with photos, color without photos, unknown color, legacy
single `color`, and no colors at all. The content lint adds: color names unique per vehicle, hex
valid, and every vehicle has at least one photo (own or shared).

**Phase 3 — Trim the backend.**
- Keep editable: Vehicles, Gallery, Testimonials, TikTok, Instagram, Blog, Site Settings
  (phone, hours, social).
- `create: false, delete: false`: Services, Team.
- `hide: true`: Navigation, Footer, Pages, FAQ (until FAQ is wired to the page).

**Phase 4 — `/app` hardening (it stays; scope kept small).**
- **Keep** VIN, chassis number, engine number and registration number in the vehicle CMS form
  (editors enter them once; invoices prefill them). Move them into a clearly labelled last group
  ("Internal — used only for quotations and invoices").
- **Stop publishing them in vehicle pages.** Today they are embedded in a `data-vehicle` attribute
  on every public vehicle page, and they also travel in the `?vehicle=` URL when opening a quote or
  invoice. Instead, the build writes `/app/vehicles.json` (disallowed in `robots.txt`, noindex tool
  area); `/app` loads it after login and gets a **vehicle picker**, and the link becomes
  `?v=<slug>`. Editors no longer need to open the public page first.
- Honest limit: the repo is public, so the values stay readable in the vehicle `.md` files on
  GitHub, and `/app/vehicles.json` is an unlisted public URL, not a secret. VINs are routinely
  printed in dealer listings, so I rate this as low risk. If it matters, make the repo private.
- Treat the `/app` password as a convenience gate. It is world-readable in a public repo
  (`lib/auth.ts`). Option: compare a SHA-256 hash instead of plaintext and rotate it. This does not
  make it secure; true protection would need Cloudflare Access or a private repo.
- Optional: export/import of saved quotations and invoices as JSON, since they live only in one
  browser's `localStorage`.

**Phase 5 — Deferred: OAuth sign-in.** Not in scope now. It needs the Cloudflare Worker
(`sveltia-cms-auth`), a GitHub OAuth App and `base_url` in `config.yml`. Revisit after the
Cloudflare decision.

## Success Criteria

- `npm run check` reports 0 errors; `npm run build` passes; CI blocks deploy on failure.
- Config-drift check and content lint pass; they fail if a CMS field is added without a Zod key.
- In the CMS: a new vehicle needs only brand, model, year, price, status, mileage and photos; the
  filename comes out as `brand-model-year.md`; the saved front matter has no `title` key.
- Marking a car Sold = open entry → click "Sold" → Save. The sitemap build then drops it.
- Hidden collections no longer appear in the CMS; their files are untouched.
- `view-source` of a vehicle page contains no VIN / chassis / engine / registration number, and
  creating an invoice from `/app` prefills them from `/app/vehicles.json`.
- A photo uploaded from an iPhone (HEIC) is saved as WebP with a name like
  `brand-model-year-xxxxxxxx.webp`, with no GPS data.
- A vehicle cannot be saved with zero photos or a duplicate VIN.
- One Alto entry with Black, White and Silver: choosing White shows White photos, `?color=white`
  opens on White, the enquiry message names the color, and `/vehicles/alto-…/` is still the only
  URL in the sitemap. The 22 existing single-`color` vehicles render exactly as before.
- Choosing a color causes no layout shift (fixed 4:3 container) and is operable by keyboard.
- `admin/index.html` loads the newest Sveltia release (unversioned URL, by the owner's choice).

## Open Questions

1. Add a `stockNo` auto-increment field (v0.237) for quotations and invoices? Default: no.
2. Per-vehicle page-bundle photo folders (responsive images)? Default: no, revisit later.
3. Is the repo meant to stay public? Default: yes (only matters for the VIN note in Phase 4).
4. Services and Team: `create: false, delete: false` (default) or hide completely?
5. Per-color stock: is `units` (blank = in stock, 0 = sold out, n = "n available") enough? It fits
   the Jimny case (2 black, 1 blue, 1 black reserved). Or do you want a per-color status such as
   Reserved?
6. Order of photos for a selected color: that color's photos first, then the shared ones (my
   default). Do you prefer shared photos first?
7. Color filter on the `/vehicles` listing page: include it (my default) or skip?
