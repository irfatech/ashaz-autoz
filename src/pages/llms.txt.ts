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

  const lines: string[] = [
    `# ${settings.siteName} — ${settings.tagline}`,
    "",
    `> ${settings.description}`,
    "",
    `Site URL: ${settings.url}`,
    "",
    "## Services",
    "",
    ...services
      .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0))
      .map(
        (s) =>
          `- [${s.data.title}](${settings.url}/services/${s.id}/): ${s.data.excerpt || s.data.description}`,
      ),
    "",
    `## Vehicle Inventory (${vehicles.length} vehicles for sale)`,
    "",
    ...vehicles.map((v) => {
      const price = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: v.data.currency || "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(v.data.price);
      return `- [${v.data.year} ${v.data.brand} ${v.data.model}](${settings.url}/vehicles/${v.id}/): ${v.data.transmission}, ${v.data.fuelType}, ${v.data.driveType}, ${v.data.mileage.toLocaleString()} km — ${price} (${v.data.status})`;
    }),
    "",
    `## Latest Blog Posts`,
    "",
    ...blog
      .filter((p) => p.data.published !== false)
      .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
      .slice(0, 5)
      .map(
        (p) =>
          `- [${p.data.title}](${settings.url}/blog/${p.id}/): ${p.data.excerpt}`,
      ),
    "",
    "## Key Information",
    "",
    `- **Address**: ${settings.address}`,
    `- **Hours**: ${settings.workingHours}`,
    `- **Phone**: ${settings.phone.join(", ")}`,
    `- **Email**: ${settings.email}`,
    `- **Currencies**: ${settings.currency}`,
    ...(settings.social?.facebook ? [`- **Facebook**: ${settings.social.facebook}`] : []),
    ...(settings.social?.instagram ? [`- **Instagram**: ${settings.social.instagram}`] : []),
    ...(settings.social?.tiktok ? [`- **TikTok**: ${settings.social.tiktok}`] : []),
    ...(settings.social?.whatsapp
      ? [
          `- **WhatsApp**: https://wa.me/${settings.social.whatsapp.replace(/[^0-9]/g, "")}`,
        ]
      : []),
    ...(settings.social?.youtube ? [`- **YouTube**: ${settings.social.youtube}`] : []),
    "",
    "## Pages",
    "",
    `- [About](${settings.url}/about/)`,
    `- [FAQ](${settings.url}/faq/)`,
    `- [Blog](${settings.url}/blog/)`,
    `- [Rentals](${settings.url}/rentals/)`,
    `- [Vehicle Inventory](${settings.url}/vehicles/)`,
    `- [Gallery](${settings.url}/gallery/)`,
    `- [Contact](${settings.url}/contact/)`,
    `- [Privacy Policy](${settings.url}/privacy/)`,
    `- [Terms & Conditions](${settings.url}/terms/)`,
    "",
    "## Frequently Asked Questions",
    "",
    ...faqs
      .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0))
      .map((f) => `- **${f.data.question}**: ${f.data.answer}`),
    "",
    "## Testimonials",
    "",
    ...testimonials.map((t) => {
      const author = t.data.company
        ? `${t.data.name} (${t.data.role ? `${t.data.role}, ` : ""}${t.data.company})`
        : t.data.name;
      return `- ${author}: "${t.data.content}" — Rating: ${t.data.rating}/5`;
    }),
    "",
    "## Structured Data",
    "",
    "The website implements the following schema.org types for Generative Engine Optimization (GEO):",
    "",
    "- **AutoDealer + LocalBusiness** (all pages): Name, logo, address, GeoCoordinates, opening hours, contact, currencies, payment methods, social profiles",
    "- **WebSite** (all pages): SearchAction targeting vehicle search",
    "- **BreadcrumbList** (all pages): Hierarchical navigation path",
    "- **Car + Offer** (vehicle detail pages): Make, model, year, mileage, price, transmission, fuel, drive, VIN, features, condition",
    "- **ItemList** (vehicles, TikTok): Numbered list collection markup",
    "- **FAQPage** (FAQ): Question + AcceptedAnswer markup for direct answers",
    "- **Article + SpeakableSpecification** (blog posts): Article with author, dates, image, and CSS selectors for AI read-aloud",
    "- **ImageGallery** (Instagram, Gallery): ImageObject collection markup",
    "- **VideoObject** (TikTok): Video with name, description, thumbnail, content URL",
    "- **Product + Review + AggregateRating** (homepage): Customer testimonials as structured reviews",
    "- **WebPage + SpeakableSpecification** (homepage): AI voice/read-aloud content markers",
    "",
    `For complete site content, see ${settings.url}/llms-full.txt`,
  ];

  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
