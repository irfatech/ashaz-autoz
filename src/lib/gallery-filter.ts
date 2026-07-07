export interface GalleryFilterConfig {
  filterBtnSelector: string;
  itemSelector: string;
  gridId: string;
  sortSelectId: string;
}

export function setupGalleryFilter(config: GalleryFilterConfig) {
  const filterBtns = document.querySelectorAll(config.filterBtnSelector);
  const items = document.querySelectorAll(config.itemSelector);
  const sortSelect = document.getElementById(config.sortSelectId) as HTMLSelectElement | null;
  const grid = document.getElementById(config.gridId);

  let currentFilter = "all";

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active", "bg-accent", "text-accent-text", "border-accent"));
      btn.classList.add("active", "bg-accent", "text-accent-text", "border-accent");
      currentFilter = (btn as HTMLElement).dataset.filter ?? "all";
      applyFilter();
    });
  });

  function applyFilter() {
    items.forEach((item) => {
      const el = item as HTMLElement;
      const cat = el.dataset.category;
      el.style.display = currentFilter === "all" || cat === currentFilter ? "" : "none";
    });
  }

  sortSelect?.addEventListener("change", () => {
    const order = sortSelect.value;
    const entries = Array.from(items) as HTMLElement[];
    entries.sort((a, b) => {
      if (order === "newest") {
        return new Date(b.dataset.date ?? 0).getTime() - new Date(a.dataset.date ?? 0).getTime();
      }
      return (parseInt(a.dataset.order ?? "99") || 99) - (parseInt(b.dataset.order ?? "99") || 99);
    });
    entries.forEach((el) => grid?.appendChild(el));
  });
}
