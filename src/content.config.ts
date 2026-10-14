import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import {
  blogSchema,
  vehiclesSchema,
  servicesSchema,
  teamSchema,
  testimonialsSchema,
  faqSchema,
  gallerySchema,
  pagesSchema,
  instagramSchema,
  siteSettingsSchema,
  tiktokSchema,
  navigationSchema,
  footerSchema,
} from "./lib/content-schemas";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: blogSchema,
});

const vehicles = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/vehicles" }),
  schema: vehiclesSchema,
});

const services = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/services" }),
  schema: servicesSchema,
});

const team = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/team" }),
  schema: teamSchema,
});

const testimonials = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/testimonials" }),
  schema: testimonialsSchema,
});

const faq = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/faq" }),
  schema: faqSchema,
});

const gallery = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/gallery" }),
  schema: gallerySchema,
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/pages" }),
  schema: pagesSchema,
});

const instagram = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/instagram" }),
  schema: instagramSchema,
});

const siteSettings = defineCollection({
  loader: glob({ pattern: "settings.yaml", base: "./src/content/site-settings" }),
  schema: siteSettingsSchema,
});

const tiktok = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/tiktok" }),
  schema: tiktokSchema,
});

const navigation = defineCollection({
  loader: glob({ pattern: "nav.yaml", base: "./src/content/navigation" }),
  schema: navigationSchema,
});

const footer = defineCollection({
  loader: glob({ pattern: "footer.yaml", base: "./src/content/footer" }),
  schema: footerSchema,
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
