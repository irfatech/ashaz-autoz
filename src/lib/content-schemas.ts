import { z } from "astro/zod";

// Single source of truth for content shapes. Imported by `src/content.config.ts` (loaders)
// and by the check scripts, so the CMS config, the build and the lint cannot disagree.

export const seoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  canonical: z.string().optional(),
  noIndex: z.boolean().optional().default(false),
});

export const blogSchema = z.object({
  title: z.string(),
  slug: z.string().optional(),
  excerpt: z.string(),
  author: z.string().default("Ashaz Autoz"),
  date: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  image: z.string().optional(),
  category: z.string().default("General"),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  lang: z.string().default("en"),
  seo: seoSchema.optional(),
});

export const transmissions = ["Automatic", "Manual", "CVT", "DCT"] as const;
export const fuelTypes = ["Petrol", "Diesel", "Hybrid", "Electric", "LPG"] as const;
export const driveTypes = ["FWD", "RWD", "AWD", "4WD"] as const;
export const vehicleStatuses = ["Available", "Reserved", "Sold", "Upcoming"] as const;
export const bodyTypes = [
  "Hatchback",
  "Sedan",
  "SUV",
  "Compact SUV",
  "Pickup",
  "Van",
  "Minibus",
  "Wagon",
  "Coupe",
] as const;

// Keys the old CMS vehicle form wrote into every file. Nothing reads them (the URL slug is the file
// name, and the page title is built from brand/model/year). They are tolerated, not required, so a
// save from a stale CMS tab cannot break the production build; `npm run check:content` warns about
// them so they get cleaned up.
export const legacyVehicleKeys = ["title", "slug"] as const;

// One color a vehicle comes in. `units`: blank = in stock, 0 = sold out, n = "n available".
// `hex` is optional because common color names are looked up in src/lib/vehicle-colors.ts.
export const vehicleColorSchema = z
  .object({
    name: z.string().trim().min(1),
    hex: z
      .string()
      .regex(/^#[0-9a-f]{6}$/i, "Use a 6-digit hex color like #1a1a1a")
      .optional(),
    units: z.coerce.number().int().min(0).optional(),
    images: z.array(z.string()).default([]),
  })
  .strict();

// Strict: any other key the schema does not declare fails the build instead of being silently
// dropped (a dropped `title` key once produced duplicate page titles).
export const vehiclesSchema = z
  .object({
    title: z.string().optional(),
    slug: z.string().optional(),
    brand: z.string(),
    model: z.string(),
    year: z.coerce.number().int().min(2000).max(2030),
    mileage: z.coerce.number().int().min(0),
    transmission: z.enum(transmissions),
    fuelType: z.enum(fuelTypes),
    engine: z.string().optional(),
    driveType: z.enum(driveTypes),
    price: z.coerce.number().int().min(0),
    currency: z.string().default("USD"),
    priceOnRequest: z.boolean().default(false),
    status: z.enum(vehicleStatuses).default("Available"),
    featured: z.boolean().default(false),
    images: z.array(z.string()).default([]),
    features: z.array(z.string()).default([]),
    doors: z.coerce.number().int().min(1).max(7).optional(),
    seats: z.coerce.number().int().min(1).max(12).optional(),
    bodyType: z.enum(bodyTypes).optional(),
    // `colors` is the current model: several colors, each with its own photos. `color` is the older
    // single-text field; entries that only have it keep working (one swatch, shared photos).
    color: z.string().optional(),
    colors: z.array(vehicleColorSchema).default([]),
    vin: z.string().optional(),
    chassisNumber: z.string().optional(),
    engineNumber: z.string().optional(),
    registrationNo: z.string().optional(),
    // When the car was first added. Filled in by the CMS on creation (never changed by edits) and used
    // to sort the CMS list newest first, so a car that was just saved is not lost among the others.
    addedOn: z.coerce.date().optional(),
  })
  .strict();

export const servicesSchema = z.object({
  title: z.string(),
  slug: z.string().optional(),
  icon: z.string().optional(),
  description: z.string(),
  excerpt: z.string().optional(),
  order: z.coerce.number().int().default(0),
  featured: z.boolean().default(false),
  image: z.string().optional(),
  features: z.array(z.string()).default([]),
  ctaText: z.string().default("Learn More"),
  ctaLink: z.string().optional(),
  lang: z.string().default("en"),
  seo: seoSchema.optional(),
});

export const teamSchema = z.object({
  name: z.string(),
  role: z.string(),
  bio: z.string().optional(),
  image: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  order: z.coerce.number().int().default(0),
  lang: z.string().default("en"),
});

export const testimonialsSchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  company: z.string().optional(),
  avatar: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  content: z.string(),
  featured: z.boolean().default(false),
  lang: z.string().default("en"),
});

export const faqSchema = z.object({
  question: z.string(),
  answer: z.string(),
  category: z.string().default("General"),
  order: z.coerce.number().int().default(0),
  lang: z.string().default("en"),
});

export const gallerySchema = z.object({
  title: z.string().optional(),
  image: z.string(),
  category: z.string().default("General"),
  featured: z.boolean().default(false),
  date: z.coerce.date().optional(),
  lang: z.string().default("en"),
});

export const pagesSchema = z.object({
  title: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  image: z.string().optional(),
  published: z.boolean().default(true),
  order: z.coerce.number().int().default(0),
  template: z.enum(["default", "full-width"]).default("default"),
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  lang: z.string().default("en"),
  seo: seoSchema.optional(),
});

export const instagramSchema = z.object({
  title: z.string(),
  instagramUrl: z.string(),
  thumbnail: z.string().optional(),
  caption: z.string().optional(),
  category: z.string().default("General"),
  featured: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
  date: z.coerce.date().optional(),
});

export const siteSettingsSchema = z.object({
  siteName: z.string().default("Ashaz Autoz"),
  tagline: z.string().default("Premium Automotive Services"),
  description: z.string(),
  url: z.string(),
  logo: z.string().optional(),
  logoDark: z.string().optional(),
  favicon: z.string().optional(),
  phone: z.array(z.string()).default([]),
  email: z.string().optional(),
  address: z.string().optional(),
  workingHours: z.string().optional(),
  social: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    youtube: z.string().optional(),
    tiktok: z.string().optional(),
    whatsapp: z.string().optional(),
  }).optional(),
  googleMapsEmbedUrl: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  foundingYear: z.coerce.number().optional(),
  priceRange: z.string().optional(),
  currency: z.string().default("USD"),
  language: z.string().default("en"),
  languages: z.array(z.string()).default(["en", "tet", "id"]),
});

export const tiktokSchema = z.object({
  title: z.string(),
  tiktokUrl: z.string(),
  thumbnail: z.string().optional(),
  caption: z.string().optional(),
  category: z.string().default("General"),
  featured: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
  date: z.coerce.date().optional(),
});

export const navigationSchema = z.object({
  items: z.array(z.object({
    label: z.string(),
    href: z.string(),
    children: z.array(z.object({
      label: z.string(),
      href: z.string(),
    })).optional(),
  })),
});

export const footerSchema = z.object({
  description: z.string().optional(),
  columns: z.array(z.object({
    title: z.string(),
    links: z.array(z.object({
      label: z.string(),
      href: z.string(),
    })),
  })),
  bottomText: z.string().optional(),
});
