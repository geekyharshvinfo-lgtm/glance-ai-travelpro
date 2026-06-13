// Simple page-level lightbox state. Any surface can open a fullscreen image viewer
// by calling openLightbox(url, alt). The <Lightbox /> component reads this store.

let _url = $state<string | null>(null);
let _alt = $state<string>('TravelPro look');

export const lightbox = {
  get url() {
    return _url;
  },
  get alt() {
    return _alt;
  },
  get open() {
    return _url !== null;
  },
};

export function openLightbox(url: string, alt = 'TravelPro look') {
  if (!url) return;
  _url = url;
  _alt = alt;
}

export function closeLightbox() {
  _url = null;
}
