import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  description: string;
  url: string;
  logo?: string;
  logoDark?: string;
  favicon?: string;
  phone: string[];
  email?: string;
  address?: string;
  workingHours?: string;
  social?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    whatsapp?: string;
  };
  googleMapsEmbedUrl?: string;
  currency: string;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const [settings] = await getCollection("site-settings");
  return settings?.data as unknown as SiteSettings ?? {
    siteName: "Ashaz Autoz",
    tagline: "Premium Automotive Services",
    description: "Your trusted automotive partner in Timor-Leste",
    url: "https://ashazautoz.com",
    phone: ["+670 7715 4379"],
    currency: "USD",
  };
}

export function formatPrice(price: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatMileage(mileage: number): string {
  return new Intl.NumberFormat("en-US").format(mileage) + " km";
}

export function getWhatsAppUrl(phone: string, message?: string): string {
  const cleaned = phone.replace(/[^0-9]/g, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${cleaned}${text}`;
}

export function generateBreadcrumbs(path: string) {
  const parts = path.split("/").filter(Boolean);
  const crumbs = [{ label: "Home", href: "/" }];

  let current = "";
  for (const part of parts) {
    current += `/${part}`;
    crumbs.push({
      label: part.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      href: current,
    });
  }

  return crumbs;
}
