// Browser behavior for the vehicle page gallery and color picker.
//
// The server already renders the full page: the default color's photos are visible, every other
// color's thumbnails are in the HTML but `hidden`, and the picker is a set of buttons. This script
// only switches what is visible, so the page still works (and every photo is still in the HTML)
// without JavaScript. It never builds markup from text, so a color name cannot inject HTML.

interface Group {
  slug: string;
  name: string;
  soldOut: boolean;
  units?: number;
  images: string[];
  /** WhatsApp enquiry link that names this color. */
  wa?: string;
}

interface GalleryData {
  label: string;
  default: string;
  groups: Group[];
}

export function initVehicleGallery(doc: Document = document): void {
  const root = doc.querySelector<HTMLElement>("[data-vehicle-gallery]");
  const raw = root?.querySelector("[data-gallery-data]")?.textContent;
  if (!root || !raw) return;

  const data: GalleryData = JSON.parse(raw);
  const main = root.querySelector<HTMLImageElement>("[data-gallery-main]");
  if (!main) return;

  const lists = [...root.querySelectorAll<HTMLElement>("[data-gallery-group]")];
  const radios = [...doc.querySelectorAll<HTMLButtonElement>("[data-color-picker] [data-color]")];
  const nameLabel = doc.querySelector("[data-color-label]");
  const stockLabel = doc.querySelector("[data-color-stock]");
  const waLinks = [...doc.querySelectorAll<HTMLAnchorElement>("[data-wa-link]")];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const find = (slug: string | null | undefined) => data.groups.find((g) => g.slug === slug);
  const stockText = (g: Group) => (g.soldOut ? "· sold out" : g.units ? `· ${g.units} available` : "");
  const altFor = (g: Group, index: number) =>
    `${data.label}${g.name ? ` in ${g.name}` : ""}${index > 0 ? ` – photo ${index + 1}` : ""}`;

  let current = find(data.default) ?? data.groups[0];

  function showPhoto(g: Group, index: number): void {
    const src = g.images[index];
    if (!src) return;

    // Only one thumbnail in the whole gallery is "current", including the hidden color groups.
    root!.querySelectorAll<HTMLElement>("[data-thumb]").forEach((a) => a.removeAttribute("aria-current"));
    root!
      .querySelectorAll<HTMLElement>(`[data-gallery-group="${CSS.escape(g.slug)}"] [data-thumb]`)
      [index]?.setAttribute("aria-current", "true");

    main!.alt = altFor(g, index);
    if (main!.getAttribute("src") === src) return;
    if (reduceMotion) {
      main!.src = src;
      return;
    }
    // Fade through a dim state while the new photo loads; the box has a fixed 4:3 size, so the page
    // never shifts.
    main!.style.transition = "opacity 150ms";
    main!.style.opacity = "0.35";
    const restore = () => {
      main!.style.opacity = "1";
    };
    main!.addEventListener("load", restore, { once: true });
    main!.addEventListener("error", restore, { once: true });
    main!.src = src;
  }

  function select(slug: string, { updateUrl = true } = {}): void {
    const g = find(slug);
    if (!g || g.soldOut) return;
    current = g;

    for (const radio of radios) {
      const on = radio.dataset.color === g.slug;
      radio.setAttribute("aria-checked", String(on));
      radio.tabIndex = on ? 0 : -1;
    }
    if (nameLabel) nameLabel.textContent = g.name;
    if (stockLabel) stockLabel.textContent = stockText(g);
    for (const list of lists) list.hidden = list.dataset.galleryGroup !== g.slug;
    if (g.wa) for (const a of waLinks) a.href = g.wa;

    showPhoto(g, 0);

    if (updateUrl) {
      const url = new URL(location.href);
      if (g.slug === data.default) url.searchParams.delete("color");
      else url.searchParams.set("color", g.slug);
      history.replaceState(history.state, "", url);
    }
  }

  // Thumbnails: show that photo instead of opening the image file.
  root.addEventListener("click", (event) => {
    const thumb = (event.target as Element).closest<HTMLElement>("[data-thumb]");
    if (!thumb) return;
    event.preventDefault();
    const thumbs = [...(thumb.closest("[data-gallery-group]")?.querySelectorAll("[data-thumb]") ?? [])];
    showPhoto(current, thumbs.indexOf(thumb));
  });

  for (const radio of radios) {
    radio.addEventListener("click", () => select(radio.dataset.color ?? ""));
    // Start loading the first photo of a color as soon as someone points at or focuses it.
    const preload = () => {
      const src = find(radio.dataset.color)?.images[0];
      if (src) new Image().src = src;
    };
    radio.addEventListener("pointerenter", preload, { once: true });
    radio.addEventListener("focus", preload, { once: true });
  }

  // Keyboard: arrow keys move through the colors that can be picked, like a native radio group.
  doc.querySelector("[data-color-picker] [role=radiogroup]")?.addEventListener("keydown", (event) => {
    const key = (event as KeyboardEvent).key;
    const enabled = radios.filter((r) => r.getAttribute("aria-disabled") !== "true");
    const at = enabled.findIndex((r) => r.dataset.color === current.slug);
    let next = -1;
    if (key === "ArrowRight" || key === "ArrowDown") next = (at + 1) % enabled.length;
    else if (key === "ArrowLeft" || key === "ArrowUp") next = (at - 1 + enabled.length) % enabled.length;
    else if (key === "Home") next = 0;
    else if (key === "End") next = enabled.length - 1;
    if (next < 0) return;
    event.preventDefault();
    select(enabled[next].dataset.color ?? "");
    enabled[next].focus();
  });

  // Deep link: /vehicles/alto-2021/?color=white opens on White. Unknown or sold-out colors are ignored.
  const wanted = new URL(location.href).searchParams.get("color")?.trim().toLowerCase();
  if (wanted && wanted !== current.slug) select(wanted, { updateUrl: false });
}
