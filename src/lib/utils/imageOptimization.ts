import { CDN_RESIZER_BASE } from '$lib/config/env';

const ENABLE_CDN_RESIZER = true; // Set to false to disable CDN optimization (for testing or fallback)
const MULTIPLIER = 2.5; // Multiplier for dimensions to ensure high-res images on retina displays

export function getOptimizedImageUrl(
  originalUrl: string | undefined,
  width: number,
  height: number,
  enableOptimization: boolean = ENABLE_CDN_RESIZER
): string {
  if (!originalUrl) return '';
  
  if (!width || !height || width <= 0 || height <= 0) {
    return originalUrl;
  }
  
  // If URL is already optimized, return as-is
  if (originalUrl.includes(CDN_RESIZER_BASE) || !enableOptimization) {
    return originalUrl;
  }

  // Round dimensions to avoid excessive cache variations
  const roundedWidth = Math.round(MULTIPLIER*width);
  const roundedHeight = Math.round(MULTIPLIER*height);

  // Build optimized URL
  return `${CDN_RESIZER_BASE}?img_url=${encodeURIComponent(originalUrl)}&w=${roundedWidth}&h=${roundedHeight}`;
}

const HERO_HEIGHT = 560; // 35rem in pixels (35 * 16)
const HERO_WIDTH_MOBILE = 411; // Typical mobile viewport

export function getHeroPreloadUrl(
  originalUrl: string | undefined
): string {
  if (!originalUrl) return '';
  
  return getOptimizedImageUrl(originalUrl, HERO_WIDTH_MOBILE, HERO_HEIGHT);
}
