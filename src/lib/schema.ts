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

export function organizationSchema(settings: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": ["AutoDealer", "LocalBusiness", "Organization"],
    name: settings.siteName,
    url: settings.url,
    logo: `${settings.url}/ashaz-logo.webp`,
    description: settings.description,
    image: `${settings.url}/ashaz-logo.webp`,
    address: settings.address
      ? {
          "@type": "PostalAddress",
          streetAddress: settings.address.split(",")[0]?.trim(),
          addressLocality: "Dili",
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
        }
      : {}),
  };
}

export function webSiteSchema(settings: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.siteName,
    url: settings.url,
    description: settings.description,
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
  },
  url: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
    description: vehicle.description,
    brand: { "@type": "Brand", name: vehicle.brand },
    model: vehicle.model,
    vehicleModelDate: vehicle.year,
    vehicleIdentificationNumber: vehicle.vin || undefined,
    sku: vehicle.slug || undefined,
    mpn: vehicle.slug || undefined,
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: vehicle.mileage,
      unitCode: "KMT",
    },
    offers: {
      "@type": "Offer",
      price: vehicle.price,
      priceCurrency: vehicle.currency,
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      itemCondition: "https://schema.org/UsedCondition",
      availability: vehicle.status === "Available" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      url,
    },
    vehicleTransmission: vehicle.transmission,
    fuelType: vehicle.fuelType,
    driveWheelConfiguration: vehicle.driveType,
    ...(vehicle.engine ? { engineType: vehicle.engine } : {}),
    ...(vehicle.color ? { color: vehicle.color } : {}),
    ...(vehicle.images?.length ? { image: vehicle.images } : {}),
    ...(vehicle.doors ? { numberOfdoors: vehicle.doors } : {}),
    ...(vehicle.seats ? { vehicleSeatingCapacity: vehicle.seats } : {}),
  };
}

export function itemListSchema(
  items: { url: string; name: string }[],
  totalItems: number,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: item.url,
      name: item.name,
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

export function aggregateRatingSchema(
  ratings: { rating: number }[],
  itemReviewed: string,
) {
  if (!ratings.length) return null;
  const avg =
    ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: itemReviewed,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avg.toFixed(1),
      bestRating: "5",
      worstRating: "1",
      ratingCount: ratings.length,
    },
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
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.headline,
    description: article.description,
    author: {
      "@type": "Person",
      name: article.author,
    },
    datePublished: article.datePublished,
    ...(article.dateModified ? { dateModified: article.dateModified } : {}),
    ...(article.image ? { image: article.image } : {}),
    url: article.url,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".prose"],
    },
  };
}

export function reviewSchema(data: {
  name: string;
  itemReviewed: string;
  reviews: { author: string; reviewBody: string; rating: number; date?: string }[];
}) {
  if (!data.reviews.length) return null;
  const avg =
    data.reviews.reduce((sum, r) => sum + r.rating, 0) /
    data.reviews.length;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.itemReviewed,
    review: data.reviews.map((r) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: "5",
      },
      author: {
        "@type": "Person",
        name: r.author,
      },
      ...(r.reviewBody ? { reviewBody: r.reviewBody } : {}),
      ...(r.date ? { datePublished: r.date } : {}),
    })),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avg.toFixed(1),
      bestRating: "5",
      worstRating: "1",
      ratingCount: data.reviews.length,
    },
  };
}

export function speakableSchema(cssSelectors: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
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
