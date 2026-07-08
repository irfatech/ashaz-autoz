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
  lat?: number;
  lng?: number;
  currency: string;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const [settings] = await getCollection("site-settings");
  if (!settings?.data) {
    return {
      siteName: "Ashaz Autoz",
      tagline: "Premium Automotive Services",
      description: "Your trusted automotive partner in Timor-Leste",
      url: "https://ashazautoz.com",
      phone: ["+670 7715 4379"],
      currency: "USD",
    };
  }
  const data = settings.data;
  return {
    siteName: data.siteName || "Ashaz Autoz",
    tagline: data.tagline || "Premium Automotive Services",
    description: data.description || "",
    url: data.url || "https://ashazautoz.com",
    logo: data.logo,
    logoDark: data.logoDark,
    favicon: data.favicon,
    phone: data.phone?.length ? data.phone : ["+670 7715 4379"],
    email: data.email,
    address: data.address,
    workingHours: data.workingHours,
    social: data.social,
    googleMapsEmbedUrl: data.googleMapsEmbedUrl,
    lat: data.lat,
    lng: data.lng,
    currency: data.currency || "USD",
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

export function phoneClean(p: string): string {
  return p.replace(/[^0-9]/g, "");
}

export function phoneDisplay(p: string): string {
  return phoneClean(p).replace(/(\d{4})(\d{4})(\d+)?/, (_, a, b, c) => c ? `${a} ${b} ${c}` : `${a} ${b}`);
}

export const statusColors: Record<string, string> = {
  Available: "bg-green-500",
  Reserved: "bg-yellow-500",
  Sold: "bg-red-500",
  Upcoming: "bg-blue-500",
};

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
