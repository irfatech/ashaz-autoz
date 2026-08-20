import type { SiteSettings } from "./site";

function parseOpeningHours(hours: string | undefined) {
  if (!hours) return undefined;
  const match = hours.match(/(\w{3})–(\w{3}),\s*(\d{1,2}):(\d{2})–(\d{1,2}):(\d{2})/);
  if (!match) return undefined;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const startDay = days.indexOf(match[1]);
  const endDay = days.indexOf(match[2]);
  if (startDay === -1 || endDay === -1) return undefined;
  const dayOfWeek = [];
  for (let i = startDay; i <= endDay; i++) {
    dayOfWeek.push(`https://schema.org/${days[i]}`);
  }
  return {
    "@type": "OpeningHoursSpecification",
    dayOfWeek,
    opens: `${match[3]}:${match[4]}`,
    closes: `${match[5]}:${match[6]}`,
  };
}

/**
 * Address strings are free text (e.g. "Ponte Foun, Comoro, Dili, Timor-Leste").
 * The trailing segment is treated as the country when it names Timor-Leste;
 * the segment before that is the locality; everything else is the street.
 */
function parseAddress(address: string | undefined) {
  if (!address) return undefined;
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return undefined;
  const hasCountry = /timor-leste/i.test(parts[parts.length - 1]);
  const localityIndex = hasCountry ? parts.length - 2 : parts.length - 1;
  const locality = parts[Math.max(localityIndex, 0)] || "Dili";
  const streetParts = parts.slice(0, Math.max(localityIndex, 1));
  return {
    street: streetParts.join(", "),
    locality,
  };
}

export function getOrganizationId(settings: SiteSettings) {
  return `${settings.url}/#organization`;
}

export function organizationSchema(
  settings: SiteSettings,
  reviews?: { author: string; reviewBody: string; rating: number; date?: string }[],
) {
  const parsedAddress = parseAddress(settings.address);
  const avgRating =
    reviews && reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": ["AutoDealer", "LocalBusiness", "Organization"],
    "@id": getOrganizationId(settings),
    name: settings.siteName,
    url: settings.url,
    logo: `${settings.url}/ashaz-logo.webp`,
    description: settings.description,
    image: `${settings.url}/ashaz-logo.webp`,
    priceRange: settings.priceRange || undefined,
    ...(settings.foundingYear ? { foundingDate: `${settings.foundingYear}` } : {}),
    address: parsedAddress
      ? {
          "@type": "PostalAddress",
          streetAddress: parsedAddress.street,
          addressLocality: parsedAddress.locality,
          addressCountry: "TL",
        }
      : undefined,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: settings.phone[0],
        contactType: "sales",
        areaServed: "TL",
        availableLanguage: ["English", "Tetum", "Indonesian"],
      },
    ],
    sameAs: [
      settings.social?.facebook,
      settings.social?.instagram,
      settings.social?.tiktok,
      settings.social?.youtube,
    ].filter(Boolean),
    openingHoursSpecification: parseOpeningHours(settings.workingHours),
    currenciesAccepted: "USD",
    paymentAccepted: ["Cash", "Bank Transfer", "Credit Card"],
    ...(settings.lat != null && settings.lng != null
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: settings.lat,
            longitude: settings.lng,
          },
          hasMap: settings.googleMapsEmbedUrl || `https://www.google.com/maps?q=${settings.lat},${settings.lng}`,
        }
      : {}),
    ...(avgRating != null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating.toFixed(1),
            bestRating: "5",
            worstRating: "1",
            ratingCount: reviews!.length,
          },
          review: reviews!.map((r) => ({
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: "5",
            },
            author: { "@type": "Person", name: r.author },
            ...(r.reviewBody ? { reviewBody: r.reviewBody } : {}),
            ...(r.date ? { datePublished: r.date } : {}),
          })),
        }
      : {}),
  };
}

export function webSiteSchema(settings: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${settings.url}/#website`,
    name: settings.siteName,
    url: settings.url,
    description: settings.description,
    publisher: { "@id": getOrganizationId(settings) },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${settings.url}/vehicles/?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function vehicleSchema(
  vehicle: {
    brand: string;
    model: string;
    year: number;
    mileage: number;
    price: number;
    currency: string;
    transmission: string;
    fuelType: string;
    driveType: string;
    engine?: string;
    color?: string;
    images?: string[];
    description?: string;
    status: string;
    slug?: string;
    vin?: string;
    doors?: number;
    seats?: number;
    priceOnRequest?: boolean;
    bodyType?: string;
  },
  url: string,
  sellerId?: string,
) {
  const availability = vehicle.priceOnRequest
    ? "https://schema.org/PreOrder"
    : vehicle.status === "Available"
      ? "https://schema.org/InStock"
      : vehicle.status === "Reserved"
        ? "https://schema.org/LimitedAvailability"
        : "https://schema.org/SoldOut";

  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
    url,
    description: vehicle.description,
    brand: { "@type": "Brand", name: vehicle.brand },
    model: vehicle.model,
    vehicleModelDate: vehicle.year,
    vehicleIdentificationNumber: vehicle.vin || undefined,
    sku: vehicle.slug || undefined,
    ...(vehicle.bodyType ? { bodyType: vehicle.bodyType } : {}),
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: vehicle.mileage,
      unitCode: "KMT",
    },
    offers: {
      "@type": "Offer",
      // When priceOnRequest, no price is disclosed — omit price *and*
      // priceCurrency together rather than emitting a currency with no price,
      // which fails structured-data validation.
      ...(vehicle.priceOnRequest ? {} : { price: vehicle.price, priceCurrency: vehicle.currency }),
      ...(vehicle.priceOnRequest
        ? {}
        : { priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] }),
      itemCondition: vehicle.priceOnRequest
        ? "https://schema.org/NewCondition"
        : "https://schema.org/UsedCondition",
      availability,
      url,
      ...(sellerId ? { seller: { "@id": sellerId } } : {}),
    },
    vehicleTransmission: vehicle.transmission,
    fuelType: vehicle.fuelType,
    driveWheelConfiguration: vehicle.driveType,
    ...(vehicle.engine ? { engineType: vehicle.engine } : {}),
    ...(vehicle.color ? { color: vehicle.color } : {}),
    ...(vehicle.images?.length ? { image: vehicle.images } : {}),
    ...(vehicle.doors ? { numberOfDoors: vehicle.doors } : {}),
    ...(vehicle.seats ? { vehicleSeatingCapacity: vehicle.seats } : {}),
  };
}

export function itemListSchema(
  items: { url: string; name: string }[],
  totalItems: number,
  itemType: string = "Car",
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": itemType,
        name: item.name,
        url: item.url,
      },
    })),
    numberOfItems: totalItems,
  };
}

export function faqPageSchema(faqs: { q: string; a: string }[]) {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

export function articleSchema(article: {
  headline: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  url: string;
  publisherName?: string;
  publisherLogo?: string;
  keywords?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: { "@type": "WebPage", "@id": article.url },
    headline: article.headline,
    description: article.description,
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: article.publisherName || "Ashaz Autoz",
      ...(article.publisherLogo ? { logo: { "@type": "ImageObject", url: article.publisherLogo } } : {}),
    },
    datePublished: article.datePublished,
    ...(article.dateModified ? { dateModified: article.dateModified } : {}),
    ...(article.image ? { image: article.image } : {}),
    ...(article.keywords?.length ? { keywords: article.keywords.join(", ") } : {}),
    url: article.url,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".prose"],
    },
  };
}

export function blogListSchema(
  posts: { url: string; name: string }[],
  settings: SiteSettings,
) {
  if (!posts.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${settings.url}/blog/#blog`,
    name: `${settings.siteName} Blog`,
    url: `${settings.url}/blog/`,
    publisher: { "@id": getOrganizationId(settings) },
    blogPost: posts.map((p) => ({ "@type": "BlogPosting", headline: p.name, url: p.url })),
  };
}

export function speakableSchema(cssSelectors: string[], url?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    ...(url ? { "@id": url, url } : {}),
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: cssSelectors,
    },
  };
}

export function videoObjectSchema(videos: {
  name: string;
  description?: string;
  thumbnailUrl?: string;
  contentUrl: string;
  embedUrl?: string;
  uploadDate: string;
}[]) {
  if (!videos.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: videos.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "VideoObject",
        name: v.name,
        ...(v.description ? { description: v.description } : {}),
        ...(v.thumbnailUrl ? { thumbnailUrl: v.thumbnailUrl } : {}),
        contentUrl: v.contentUrl,
        ...(v.embedUrl ? { embedUrl: v.embedUrl } : {}),
        uploadDate: v.uploadDate,
      },
    })),
    numberOfItems: videos.length,
  };
}

export function imageGallerySchema(images: {
  url: string;
  caption?: string;
}[]) {
  if (!images.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    image: images.map((img) => ({
      "@type": "ImageObject",
      url: img.url,
      ...(img.caption ? { caption: img.caption } : {}),
    })),
  };
}

export function serviceSchema(
  service: {
    name: string;
    description: string;
    url: string;
    serviceType?: string;
    image?: string;
  },
  settings: SiteSettings,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    url: service.url,
    serviceType: service.serviceType || service.name,
    provider: { "@id": getOrganizationId(settings) },
    areaServed: {
      "@type": "Country",
      name: "Timor-Leste",
    },
    ...(service.image ? { image: service.image } : {}),
  };
}

export function personSchema(person: {
  name: string;
  role: string;
  bio?: string;
  image?: string;
}, settings: SiteSettings) {
  return {
    "@type": "Person",
    name: person.name,
    jobTitle: person.role,
    ...(person.bio ? { description: person.bio } : {}),
    ...(person.image ? { image: person.image } : {}),
    worksFor: { "@id": getOrganizationId(settings) },
  };
}

export function aboutPageSchema(
  settings: SiteSettings,
  team: { name: string; role: string; bio?: string; image?: string }[],
  url: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url,
    mainEntity: {
      "@id": getOrganizationId(settings),
      "@type": ["AutoDealer", "LocalBusiness", "Organization"],
      name: settings.siteName,
      ...(team.length ? { employee: team.map((t) => personSchema(t, settings)) } : {}),
    },
  };
}

export function contactPageSchema(settings: SiteSettings, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    url,
    mainEntity: { "@id": getOrganizationId(settings) },
  };
}
