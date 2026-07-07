import { z, defineCollection } from "astro:content";
import { glob } from "astro/loaders";

const seoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  canonical: z.string().optional(),
  noIndex: z.boolean().optional().default(false),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
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
  }),
});

const vehicles = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/vehicles" }),
  schema: z.object({
    brand: z.string(),
    model: z.string(),
    year: z.coerce.number().int().min(2000).max(2030),
    mileage: z.coerce.number().int().min(0),
    transmission: z.enum(["Automatic", "Manual", "CVT", "DCT"]),
    fuelType: z.enum(["Petrol", "Diesel", "Hybrid", "Electric", "LPG"]),
    engine: z.string().optional(),
    driveType: z.enum(["FWD", "RWD", "AWD", "4WD"]),
    price: z.coerce.number().int().min(0),
    currency: z.string().default("USD"),
    status: z.enum(["Available", "Reserved", "Sold"]).default("Available"),
    featured: z.boolean().default(false),
    images: z.array(z.string()).default([]),
    features: z.array(z.string()).default([]),
    doors: z.coerce.number().int().min(1).max(7).optional(),
    seats: z.coerce.number().int().min(1).max(12).optional(),
    color: z.string().optional(),
    colorHex: z.string().optional(),
    registrationYear: z.coerce.number().int().optional(),
    vin: z.string().optional(),
    slug: z.string().optional(),
    lang: z.string().default("en"),
    seo: seoSchema.optional(),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/services" }),
  schema: z.object({
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
  }),
});

const team = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/team" }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string().optional(),
    image: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    order: z.coerce.number().int().default(0),
    lang: z.string().default("en"),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/testimonials" }),
  schema: z.object({
    name: z.string(),
    role: z.string().optional(),
    company: z.string().optional(),
    avatar: z.string().optional(),
    rating: z.coerce.number().int().min(1).max(5).default(5),
    content: z.string(),
    featured: z.boolean().default(false),
    lang: z.string().default("en"),
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/faq" }),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    category: z.string().default("General"),
    order: z.coerce.number().int().default(0),
    lang: z.string().default("en"),
  }),
});

const gallery = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/gallery" }),
  schema: z.object({
    title: z.string().optional(),
    image: z.string(),
    category: z.string().default("General"),
    featured: z.boolean().default(false),
    date: z.coerce.date().optional(),
    lang: z.string().default("en"),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
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
  }),
});

const instagram = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/instagram" }),
  schema: z.object({
    title: z.string(),
    instagramUrl: z.string(),
    thumbnail: z.string().optional(),
    caption: z.string().optional(),
    category: z.string().default("General"),
    featured: z.boolean().default(false),
    order: z.coerce.number().int().default(0),
    date: z.coerce.date().optional(),
  }),
});

const siteSettings = defineCollection({
  loader: glob({ pattern: "settings.yaml", base: "./src/content/site-settings" }),
  schema: z.object({
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
    currency: z.string().default("USD"),
    language: z.string().default("en"),
    languages: z.array(z.string()).default(["en", "tet", "id"]),
  }),
});

const tiktok = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/tiktok" }),
  schema: z.object({
    title: z.string(),
    tiktokUrl: z.string(),
    thumbnail: z.string().optional(),
    caption: z.string().optional(),
    category: z.string().default("General"),
    featured: z.boolean().default(false),
    order: z.coerce.number().int().default(0),
    date: z.coerce.date().optional(),
  }),
});

const navigation = defineCollection({
  loader: glob({ pattern: "nav.yaml", base: "./src/content/navigation" }),
  schema: z.object({
    items: z.array(z.object({
      label: z.string(),
      href: z.string(),
      children: z.array(z.object({
        label: z.string(),
        href: z.string(),
      })).optional(),
    })),
  }),
});

const footer = defineCollection({
  loader: glob({ pattern: "footer.yaml", base: "./src/content/footer" }),
  schema: z.object({
    description: z.string().optional(),
    columns: z.array(z.object({
      title: z.string(),
      links: z.array(z.object({
        label: z.string(),
        href: z.string(),
      })),
    })),
    bottomText: z.string().optional(),
  }),
});

export const collections = {
  blog,
  vehicles,
  services,
  team,
  testimonials,
  faq,
  gallery,
  pages,
  "site-settings": siteSettings,
  navigation,
  footer,
  tiktok,
  instagram,
};
