import { beforeNavigate, afterNavigate } from '$app/navigation';
import { browser } from '$app/environment';

export function useHorizontalScrollRestore(
  key: string,
  getElement: () => HTMLElement | null | undefined
) {
  if (!browser) return;

  beforeNavigate(() => {
    const el = getElement();
    if (el) {
      sessionStorage.setItem(`${key}-scroll-left`, String(el.scrollLeft));
    }
  });

  afterNavigate(() => {
    const el = getElement();
    const saved = sessionStorage.getItem(`${key}-scroll-left`);

    if (el && saved) {
      requestAnimationFrame(() => {
        el.scrollLeft = parseInt(saved);
      });
      sessionStorage.removeItem(`${key}-scroll-left`);
    }
  });
}
