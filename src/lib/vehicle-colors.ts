// Color handling for vehicles that come in several colors.
//
// A vehicle lists its colors in `colors` (each with its own photos) plus shared `images` that look
// the same in every color (interior, engine). Older entries only have a single `color` text and
// keep working: they resolve to one swatch that shows the shared photos.
//
// This file is plain TypeScript with no framework imports so it can be unit tested with
// `node --test` and used from Astro pages, components and scripts alike.

export interface ColorInput {
  name: string;
  hex?: string;
  /** blank = in stock, 0 = sold out, n = "n available" */
  units?: number;
  images?: string[];
}

export interface VehicleColorSource {
  images?: string[];
  /** Legacy single color text, e.g. "Silver" or "Black, Blue". */
  color?: string;
  colors?: ColorInput[];
}

export interface ResolvedColor {
  name: string;
  slug: string;
  hex?: string;
  units?: number;
  soldOut: boolean;
  /** Photos of this color only (may be empty). */
  images: string[];
}

export interface ResolvedGallery {
  /** The selected color, or undefined when the vehicle has no color information. */
  color?: ResolvedColor;
  /** The color's own photos first, then the shared photos, without duplicates. */
  images: string[];
}

const KNOWN_HEX: Record<string, string> = {
  black: "#1a1a1a",
  white: "#f5f5f5",
  silver: "#c0c0c0",
  grey: "#808080",
  gray: "#808080",
  red: "#c8102e",
  blue: "#1e56a0",
  navy: "#1b2a49",
  green: "#2e7d32",
  beige: "#d9c7a3",
  champagne: "#e8d8b0",
  brown: "#6d4c41",
  gold: "#c9a227",
  orange: "#ef6c00",
  yellow: "#f2c200",
  maroon: "#7b1e2b",
  purple: "#6a3d9a",
  pink: "#e58bb0",
};

export function colorSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Best-effort swatch color for a color name, so editors do not have to pick a hex value.
 * "Pearl White" and "Dark Blue" resolve through their last word. Unknown names return undefined.
 */
export function hexFor(name: string): string | undefined {
  const words = name.trim().toLowerCase().split(/[^a-z]+/).filter(Boolean);
  if (words.length === 0) return undefined;
  const whole = words.join(" ");
  if (KNOWN_HEX[whole]) return KNOWN_HEX[whole];
  for (let i = words.length - 1; i >= 0; i--) {
    if (KNOWN_HEX[words[i]]) return KNOWN_HEX[words[i]];
  }
  return undefined;
}

const unique = (list: string[]): string[] => [...new Set(list.filter(Boolean))];

export function resolveColors(vehicle: VehicleColorSource): ResolvedColor[] {
  const listed = vehicle.colors ?? [];
  if (listed.length > 0) {
    return listed.map((c) => ({
      name: c.name.trim(),
      slug: colorSlug(c.name),
      hex: c.hex ?? hexFor(c.name),
      units: c.units,
      soldOut: c.units === 0,
      images: unique(c.images ?? []),
    }));
  }

  const legacy = (vehicle.color ?? "")
    .split(/[,/]/)
    .map((n) => n.trim())
    .filter(Boolean);
  return legacy.map((name) => ({
    name,
    slug: colorSlug(name),
    hex: hexFor(name),
    units: undefined,
    soldOut: false,
    images: [],
  }));
}

/** All color names as one text, e.g. "Black, Blue". Empty when the vehicle has no color. */
export function colorNames(vehicle: VehicleColorSource): string {
  return resolveColors(vehicle)
    .map((c) => c.name)
    .join(", ");
}

/** The color shown first: the first one that is not sold out, otherwise the first one. */
export function defaultColor(colors: ResolvedColor[]): ResolvedColor | undefined {
  return colors.find((c) => !c.soldOut) ?? colors[0];
}

/** Find a color by slug or by name, ignoring case. */
export function findColor(colors: ResolvedColor[], query?: string): ResolvedColor | undefined {
  const q = (query ?? "").trim().toLowerCase();
  if (!q) return undefined;
  const slug = colorSlug(q);
  return colors.find((c) => c.slug === slug || c.name.toLowerCase() === q);
}

/**
 * The photos to show for a color. An unknown or missing color falls back to the default color, and
 * a vehicle without colors shows its shared photos.
 */
export function resolveGallery(vehicle: VehicleColorSource, colorQuery?: string): ResolvedGallery {
  const shared = vehicle.images ?? [];
  const colors = resolveColors(vehicle);
  const color = findColor(colors, colorQuery) ?? defaultColor(colors);
  return { color, images: unique([...(color?.images ?? []), ...shared]) };
}

/** Cover image for listing cards: the default color's first photo. */
export function coverImage(vehicle: VehicleColorSource): string | undefined {
  return resolveGallery(vehicle).images[0];
}

/** Every photo of the vehicle across all colors, for structured data and the photo-count lint. */
export function allImages(vehicle: VehicleColorSource): string[] {
  return unique([...resolveColors(vehicle).flatMap((c) => c.images), ...(vehicle.images ?? [])]);
}
