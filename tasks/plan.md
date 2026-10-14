# Implementation Plan: Simpler CMS, Multi-color Vehicles, Safer `/app`

Source of truth: [SPEC.md](../SPEC.md) (approved, with all default answers accepted).
Task list: [tasks/todo.md](todo.md) (default target; no external tracker is designated).

## Overview

Make vehicle add/update fast and hard to get wrong. In order: pin and gate the tooling, make the CMS
form and the Zod schema match, improve the vehicle form and photo handling, add one-entry
multi-color vehicles with a color picker, trim the CMS to what changes often, and stop publishing
internal vehicle identifiers in public pages. OAuth is deferred.

## Architecture Decisions

- **Zod is the single source of truth.** The vehicle shape moves to a plain TS module
  (`src/lib/content-schemas.ts`) imported by `content.config.ts` and by the check scripts, so
  the drift check and content lint can never disagree with the build.
- **Additive data model.** `colors` is a new optional list. The legacy `color` string stays valid
  and renders as one swatch, so the 22 existing vehicles never break between tasks.
- **Colors are not URLs.** One canonical URL per vehicle; `?color=` is client-side state only.
  The server-rendered HTML holds the default color's gallery (works without JS, no duplicate
  pages for Google, no sitemap change).
- **Pure logic is testable.** Gallery/color resolution lives in `src/lib/vehicle-colors.ts` and is
  tested with Node's built-in `node:test` (no test framework added).
- **Flat vehicle fields stay flat.** "Internal" identifiers are grouped by order and hint text, not
  an Object field, because nesting would change the stored shape and break `/app` and the sitemap
  script's `status:` regex.
- **`/app` data comes from a build-time JSON** (`/app/vehicles.json`), not from public page HTML or
  URL parameters.
- **One commit per task**, each leaving `npm run check && npm run build` green.

## Dependency Graph

```
T1 pin CMS ─┐
T2 CI gate ─┼─► Checkpoint 0
T3 prettier ┘
                │
T4 strip dead keys ─► T5 vehicle parity + shared schema ─► T6 other drift
                                    │                          │
                                    └──────► T7 check scripts ◄┘ ─► Checkpoint 1
                                                    │
                      ┌─────────────────────────────┤
                      ▼                             ▼
          T8 vehicle form UX            T10 colors: schema + resolver + tests
          T9 media/photos                           │
                      │                  T11 colors: CMS list + migration script
                      ▼                             │
              Checkpoint 2                  T12 run migration
                                                    │
                          ┌─────────────────────────┼───────────────┐
                          ▼                         ▼               ▼
                T13 detail page picker     T14 cards + filter   T15 JSON-LD
                          └─────────────────────────┴───────────────┘
                                                    ▼
                                             Checkpoint 3
                                                    │
                T16 hide/lock collections ──────────┤
                T17 /app/vehicles.json ─► T18 quotation ─► T19 invoice ─► T20 remove public data
                                                                           │
                                                                     Checkpoint 4
```

Parallel-safe pairs (different files): T8 ∥ T9 (both touch `config.yml`, so sequence them if one
agent), T13 ∥ T14 ∥ T15 (different files), T16 ∥ T17.

## Phases

| Phase | Tasks | Outcome |
|---|---|---|
| 0 Guard rails | T1–T3 | CMS pinned, CI blocks broken builds, formatter works |
| 1 Parity | T4–T7 | CMS ⇄ Zod match, enforced by scripts |
| 2 Fast add/update | T8–T9 | Quick vehicle form, SEO-friendly photo names, HEIC ok |
| 2c Multi-color | T10–T15 | One entry, many colors, picker swaps photos |
| 3 Trim backend | T16 | Only frequently-edited content visible in CMS |
| 4 `/app` | T17–T22 | Picker, no public identifiers, optional password/backup |
| 5 OAuth | — | Deferred until the Cloudflare decision |

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `.strict()` on the vehicle schema fails the build on existing files with dead `title:`/`slug:` keys | High | T4 strips them first, in a separate commit, before T5 enables strict |
| `astro/zod` is not importable from plain Node scripts | Med | T5 starts with a 10-minute spike; fallback: scripts parse the schema file's key list |
| The CMS cannot be exercised headlessly | Med | Validate `config.yml` against the official JSON schema (`ajv-cli` via `npx`, nothing installed); final check is a manual smoke test in Chrome using the **local repository** mode so no commit hits `main` |
| `thumbnail`/`summary` behavior with list-of-image fields differs from the schema text | Low | Verified in the smoke test; fall back to `thumbnail: images` auto-detect |
| `{{slug}}` in `filename_template` is unavailable until first save | Low | Documented behavior: rename happens on entry save; verify in smoke test |
| Two units of the same model/year collide on the slug `brand-model-year` | Low | `slug.editable: [create]` lets the editor add a suffix when creating |
| Color migration mangles existing entries | Med | Script is idempotent, run on a branch, diff reviewed, `git revert`-able single commit |
| HEIC conversion downloads libheif from unpkg on first use | Low | Needs internet for the editor; no site impact. Add `blob:` to `worker-src` only if a CSP is ever added |
| Adding `yaml` devDependency | Low | Needed to parse front matter and `config.yml`; flagged for your nod below |

## Items Needing Your Nod Before They Start

1. **T2** edits `.github/workflows/deploy.yml` (adds the check gate).
2. **T3 and T7** add devDependencies: `prettier-plugin-astro`, `yaml`.
3. **T20** removes `data-vehicle` from public pages — after T18/T19 the old quote/invoice links
   stop working, so this lands only once `/app` has the picker.
4. **T21** (optional) needs you to choose a new `/app` password.

## Open Questions

None blocking. All Open Questions from the spec were answered with the defaults.
