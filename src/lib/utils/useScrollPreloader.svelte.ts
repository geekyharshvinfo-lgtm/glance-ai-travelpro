// Module-level cache so the same URL is never fetched twice across sections
// within a single browser session. Strings are tiny — no memory concern.
const preloadedCache = new Set<string>();

/**
 * Sets up an IntersectionObserver on `itemSelector` children inside the
 * scroll container returned by `getContainer`. When a child is about to
 * enter the visible area (controlled by `rootMargin`), its
 * `data-preload-url` attribute is read and fetched via `new Image()`.
 *
 * Rules:
 * - No-ops if IntersectionObserver is unavailable (SSR / old browsers).
 * - Skips items whose `data-preload-url` isn't set yet (URL still computing).
 * - Never fetches the same URL twice (module-level cache).
 * - Cleans up the observer on component destroy.
 *
 * Usage in a horizontal snap-scroll component:
 *   useScrollPreloader(() => containerEl, '.card-class');
 *
 * Usage in a vertical scroll component:
 *   useScrollPreloader(() => containerEl, '.card-class', '400px 0px 400px 0px');
 */
export function useScrollPreloader(
  getContainer: () => HTMLElement | undefined,
  itemSelector: string,
  rootMargin = '400px 800px 400px 800px'
): void {
  $effect(() => {
    const container = getContainer();
    if (!container || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const url = (entry.target as HTMLElement).dataset.preloadUrl;
          if (!url || preloadedCache.has(url)) continue;
          preloadedCache.add(url);
          const img = new Image();
          img.src = url;
        }
      },
      { root: container, rootMargin, threshold: 0 }
    );

    container.querySelectorAll(itemSelector).forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  });
}
