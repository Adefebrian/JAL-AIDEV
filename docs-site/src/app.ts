// docs-site/src/app.ts
//
// The entire interactive layer of the docs site, in plain TypeScript, no
// framework. The page itself is fully readable and navigable with this
// script disabled (every link is a real anchor href, every FAQ answer is
// a native <details>), so this file only adds progressive-enhancement
// niceties: copy buttons, the mobile section drawer, and active-tab
// tracking for the bottom tab bar. That is why React was skipped for this
// project: nothing here needs component state, a virtual DOM, or
// client-side rendering, a few DOM listeners cover the whole surface.

function setUpCopyButtons() {
  const buttons = document.querySelectorAll<HTMLButtonElement>(".copy-btn");
  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const text = button.dataset.copy ?? "";
      try {
        await navigator.clipboard.writeText(text);
        flashCopied(button);
      } catch {
        // Clipboard API can be unavailable (insecure context, denied
        // permission). Fail quietly rather than throwing in the console,
        // the command text is still fully visible and selectable by hand.
      }
    });
  });
}

function flashCopied(button: HTMLButtonElement) {
  const original = button.textContent ?? "Copy";
  button.textContent = "Copied";
  button.classList.add("copy-btn-done");
  window.setTimeout(() => {
    button.textContent = original;
    button.classList.remove("copy-btn-done");
  }, 1500);
}

function setUpDrawer() {
  const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  const drawer = document.querySelector<HTMLElement>("[data-drawer]");
  if (!toggle || !drawer) return;

  function close() {
    drawer!.hidden = true;
    toggle!.setAttribute("aria-expanded", "false");
  }

  function open() {
    drawer!.hidden = false;
    toggle!.setAttribute("aria-expanded", "true");
  }

  toggle.addEventListener("click", () => {
    if (drawer.hidden) open();
    else close();
  });

  drawer.querySelectorAll<HTMLAnchorElement>("[data-drawer-link]").forEach((link) => {
    link.addEventListener("click", close);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
}

function setUpTabBarActiveState() {
  const tabItems = document.querySelectorAll<HTMLAnchorElement>(".tab-item");
  if (tabItems.length === 0 || !("IntersectionObserver" in window)) return;

  const idToTab = new Map<string, HTMLAnchorElement>();
  tabItems.forEach((tab) => {
    const id = tab.dataset.tab;
    if (id) idToTab.set(id, tab);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const tab = idToTab.get(entry.target.id);
        if (!tab) continue;
        if (entry.isIntersecting) {
          tabItems.forEach((item) => item.classList.remove("tab-item-active"));
          tab.classList.add("tab-item-active");
        }
      }
    },
    { rootMargin: "-45% 0px -45% 0px" },
  );

  idToTab.forEach((_tab, id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}

function init() {
  setUpCopyButtons();
  setUpDrawer();
  setUpTabBarActiveState();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
