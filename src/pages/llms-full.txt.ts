import { getCollection } from "astro:content";
import { getSiteSettings } from "../lib/site";

export const prerender = true;

export async function GET() {
  const settings = await getSiteSettings();
  const services = await getCollection("services");
  const vehicles = await getCollection("vehicles");
  const blog = await getCollection("blog");
  const faqs = await getCollection("faq");
  const testimonials = await getCollection("testimonials");
  const team = await getCollection("team");
  const gallery = await getCollection("gallery");
  const instagram = await getCollection("instagram");
  const tiktok = await getCollection("tiktok");
  const pages = await getCollection("pages");

  const lines: string[] = [
    `# ${settings.siteName} — ${settings.tagline}`,
    "",
    `> ${settings.description}`,
    "",
    `Site URL: ${settings.url}`,
    "",
    "---",
    "",
    "## Company Overview",
    "",
    `${settings.siteName} is a full-service automotive company operating from ${settings.address}. With over 15 years of experience, we provide comprehensive automotive solutions including vehicle sales, imports, rentals, workshop maintenance, diagnostics, VIP transport, and spare parts.`,
    "",
    "### Key Facts",
    "",
    `- **Business Name**: ${settings.siteName}`,
    `- **Tagline**: ${settings.tagline}`,
    `- **Address**: ${settings.address}`,
    ...(settings.lat && settings.lng
      ? [`- **Coordinates**: ${settings.lat}, ${settings.lng}`]
      : []),
    `- **Hours**: ${settings.workingHours}`,
    `- **Phone**: ${settings.phone.join(" | ")}`,
    `- **Email**: ${settings.email}`,
    `- **Currency**: ${settings.currency}`,
    `- **Languages**: English, Tetum, Indonesian`,
    "",
    "### Social Media",
    "",
    ...(settings.social?.facebook ? [`- Facebook: ${settings.social.facebook}`] : []),
    ...(settings.social?.instagram ? [`- Instagram: ${settings.social.instagram}`] : []),
    ...(settings.social?.tiktok ? [`- TikTok: ${settings.social.tiktok}`] : []),
    ...(settings.social?.youtube ? [`- YouTube: ${settings.social.youtube}`] : []),
    ...(settings.social?.whatsapp
      ? [
          `- WhatsApp: https://wa.me/${settings.social.whatsapp.replace(/[^0-9]/g, "")}`,
        ]
      : []),
    "",
    "---",
    "",
    "## Services",
    "",
    ...(await Promise.all(
      services
        .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0))
        .map(async (s) => {
          const slug = s.id;
          return [
            `### ${s.data.title}`,
            `URL: ${settings.url}/services/${slug}/`,
            "",
            `${s.data.description}`,
            ...(s.data.features?.length
              ? ["", "Features:", ...s.data.features.map((f) => `  - ${f}`)]
              : []),
            "",
          ].join("\n");
        }),
    )),
    "---",
    "",
    "## Vehicle Inventory",
    "",
    `Total vehicles: ${vehicles.length}`,
    "",
    ...vehicles.map((v) => {
      const price = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: v.data.currency || "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(v.data.price);
      return [
        `### ${v.data.year} ${v.data.brand} ${v.data.model}`,
        `URL: ${settings.url}/vehicles/${v.id}/`,
        "",
        `- **Price**: ${price}`,
        `- **Status**: ${v.data.status}`,
        `- **Mileage**: ${v.data.mileage.toLocaleString()} km`,
        `- **Transmission**: ${v.data.transmission}`,
        `- **Fuel Type**: ${v.data.fuelType}`,
        `- **Drive**: ${v.data.driveType}`,
        ...(v.data.engine ? [`- **Engine**: ${v.data.engine}`] : []),
        ...(v.data.color ? [`- **Color**: ${v.data.color}`] : []),
        ...(v.data.doors ? [`- **Doors**: ${v.data.doors}`] : []),
        ...(v.data.seats ? [`- **Seats**: ${v.data.seats}`] : []),
        ...(v.data.vin ? [`- **VIN**: ${v.data.vin}`] : []),
        ...(v.data.features?.length
          ? ["", "Features:", ...v.data.features.map((f) => `  - ${f}`)]
          : []),
        "",
      ].join("\n");
    }),
    "---",
    "",
    "## Blog Posts",
    "",
    ...blog
      .filter((p) => p.data.published !== false)
      .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
      .map((p) => {
        return [
          `### ${p.data.title}`,
          `URL: ${settings.url}/blog/${p.id}/`,
          `Author: ${p.data.author}`,
          `Date: ${p.data.date.toISOString().split("T")[0]}`,
          `Category: ${p.data.category}`,
          ...(p.data.tags?.length ? [`Tags: ${p.data.tags.join(", ")}`] : []),
          "",
          `${p.data.excerpt}`,
          "",
        ].join("\n");
      }),
    "---",
    "",
    "## Team",
    "",
    ...team
      .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0))
      .map((m) => {
        return [
          `### ${m.data.name}`,
          `Role: ${m.data.role}`,
          ...(m.data.bio ? [`Bio: ${m.data.bio}`] : []),
          ...(m.data.email ? [`Email: ${m.data.email}`] : []),
          ...(m.data.phone ? [`Phone: ${m.data.phone}`] : []),
          "",
        ].join("\n");
      }),
    "---",
    "",
    "## Testimonials",
    "",
    ...testimonials.map((t, i) => {
      const author = t.data.company
        ? `${t.data.name}${t.data.role ? `, ${t.data.role}` : ""} — ${t.data.company}`
        : t.data.name;
      return `${i + 1}. **${author}**: "${t.data.content}" — Rating: ${t.data.rating}/5`;
    }),
    "",
    "---",
    "",
    "## Frequently Asked Questions",
    "",
    ...faqs
      .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0))
      .map(
        (f, i) =>
          `${i + 1}. **${f.data.question}**\n\n   ${f.data.answer}`,
      ),
    "",
    "---",
    "",
    "## Gallery",
    "",
    ...gallery.map(
      (g) =>
        `- ${g.data.title || "Untitled"} — Category: ${g.data.category} — Image: ${settings.url}${g.data.image}`,
    ),
    "",
    "---",
    "",
    "## Instagram Posts",
    "",
    ...instagram
      .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0))
      .map(
        (p) =>
          `- **${p.data.title}**: ${p.data.instagramUrl}${p.data.caption ? ` — ${p.data.caption}` : ""}`,
      ),
    "",
    "---",
    "",
    "## TikTok Videos",
    "",
    ...tiktok
      .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0))
      .map(
        (v) =>
          `- **${v.data.title}**: ${v.data.tiktokUrl}${v.data.caption ? ` — ${v.data.caption}` : ""}`,
      ),
    "",
    "---",
    "",
    "## Content Pages",
    "",
    ...pages
      .filter((p) => p.data.published !== false)
      .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0))
      .map((p) => {
        return [
          `### ${p.data.title}`,
          `URL: ${settings.url}/${p.data.slug}/`,
          ...(p.data.description ? [`Description: ${p.data.description}`] : []),
          ...(p.data.heroTitle ? [`Hero: ${p.data.heroTitle}`] : []),
          ...(p.data.heroSubtitle ? [`Hero Subtitle: ${p.data.heroSubtitle}`] : []),
          "",
        ].join("\n");
      }),
    "---",
    "",
    "## Statistics",
    "",
    `${settings.siteName} reports the following business statistics:`,
    "",
    `- Vehicles currently for sale: ${vehicles.length}`,
    `- Services offered: ${services.length}`,
    `- Team members: ${team.length}`,
    `- Customer testimonials: ${testimonials.length}`,
    `- Blog posts published: ${blog.length}`,
    `- Social media posts (Instagram): ${instagram.length}`,
    `- Social media videos (TikTok): ${tiktok.length}`,
    "",
    "---",
    "",
    "## Structured Data Summary",
    "",
    "The website implements comprehensive schema.org structured data for GEO (Generative Engine Optimization):",
    "",
    "| Schema Type | Pages Applied | Key Properties |",
    "|---|---|---|",
    "| AutoDealer + LocalBusiness | All pages | @id, name, url, logo, image, address (PostalAddress), GeoCoordinates (latitude, longitude), openingHoursSpecification, telephone, email, sameAs (social profiles), currenciesAccepted, paymentAccepted |",
    "| WebSite | All pages | url, name, description, potentialAction (SearchAction with target query parameter) |",
    "| BreadcrumbList | All pages | itemListElement with Position and Item (name + @id) |",
    "| Car + Product + Offer | Vehicle detail | brand, model, vehicleModelDate, mileageFromOdometer, vehicleTransmission, fuelType, driveWheelConfiguration, vehicleEngine, color, numberOfDoors, numberOfSeats, sku, mpn, itemCondition, description, offers (Offer with price, priceCurrency, availability, url) |",
    "| ItemList | Vehicle listing, TikTok | numberOfItems, itemListElement (ListItems with position, url, name) |",
    "| FAQPage | FAQ page | mainEntity (Question + AcceptedAnswer) |",
    "| Article | Blog posts | headline, author (Person), datePublished, dateModified, image, publisher, speakable (SpeakableSpecification with cssSelector) |",
    "| ImageGallery | Instagram, Gallery | associatedMedia (ImageObject with url, caption, thumbnail) |",
    "| VideoObject | TikTok page | associatedMedia (VideoObject with name, description, thumbnailUrl, contentUrl, uploadDate) |",
    "| Product + Review + AggregateRating | Homepage | name, review (Review with author Person, reviewRating, reviewBody), aggregateRating (ratingValue, bestRating, worstRating, ratingCount) |",
    "| WebPage + SpeakableSpecification | Homepage | speakable (SpeakableSpecification with cssSelector targeting .hero-section, .prose) |",
    "",
    "---",
    "",
    "## Contact Information",
    "",
    `For inquiries about vehicle sales, imports, rentals, workshop services, or any other automotive needs:`,
    "",
    `- **Phone**: ${settings.phone.join(" | ")}`,
    `- **Email**: ${settings.email}`,
    `- **Location**: ${settings.address}`,
    `- **Hours**: ${settings.workingHours}`,
    ...(settings.social?.whatsapp
      ? [`- **WhatsApp**: https://wa.me/${settings.social.whatsapp.replace(/[^0-9]/g, "")}`]
      : []),
  ];

  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
