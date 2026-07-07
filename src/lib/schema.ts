import type { SiteSettings } from "./site";

export function organizationSchema(settings: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.siteName,
    url: settings.url,
    logo: `${settings.url}/ashaz-logo.png`,
    description: settings.description,
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
      },
    ],
    sameAs: [
      settings.social?.facebook,
      settings.social?.instagram,
      settings.social?.tiktok,
    ].filter(Boolean),
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
  },
  url: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
    brand: { "@type": "Brand", name: vehicle.brand },
    model: vehicle.model,
    vehicleModelDate: vehicle.year,
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: vehicle.mileage,
      unitCode: "KMT",
    },
    offers: {
      "@type": "Offer",
      price: vehicle.price,
      priceCurrency: vehicle.currency,
      availability: vehicle.status === "Available" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      url,
    },
    vehicleTransmission: vehicle.transmission,
    fuelType: vehicle.fuelType,
    driveWheelConfiguration: vehicle.driveType,
    ...(vehicle.engine ? { engineType: vehicle.engine } : {}),
    ...(vehicle.color ? { color: vehicle.color } : {}),
    ...(vehicle.images?.length ? { image: vehicle.images } : {}),
  };
}
