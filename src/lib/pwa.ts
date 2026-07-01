export type Platform = "android" | "ios" | "desktop" | "unknown";

export function getPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "desktop";
}

export function isInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export interface PlatformInstructions {
  icon: string;
  title: string;
  steps: string[];
}

export const platformInstructions: Record<Platform, PlatformInstructions> = {
  android: {
    icon: "M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z",
    title: "Install on Android",
    steps: [
      "Tap the ⋮ menu button in the top-right corner of Chrome",
      'Select "Install app" or "Add to Home Screen" from the menu',
      'Tap "Install" in the popup dialog',
      "The app icon will appear on your home screen",
    ],
  },
  ios: {
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
    title: "Install on iPhone / iPad",
    steps: [
      "Tap the Share button (square with arrow) at the bottom of Safari",
      "Scroll down and tap Add to Home Screen",
      'Type a name for the app (or keep "Ashaz Autoz")',
      'Tap "Add" in the top-right corner',
      "The app icon will appear on your home screen",
    ],
  },
  desktop: {
    icon: "M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9 8h2v8H9zm4 0h2v8h-2z",
    title: "Install on Desktop",
    steps: [
      "Click the install icon (⊕) in the right side of the address bar",
      'Alternatively, click the browser menu → "Install Ashaz Autoz"',
      'Click "Install" in the popup dialog',
      "The app will open in its own window",
    ],
  },
  unknown: {
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z",
    title: "Install the App",
    steps: [
      "Open this site using Chrome, Edge, or Safari",
      "Look for the install option in the browser menu",
      'Select "Install" or "Add to Home Screen"',
      "Follow the on-screen prompts to complete installation",
    ],
  },
};
