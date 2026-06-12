import { trackEvent } from './analytics';
import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, STATUS } from '$lib/constants/analytics';
import { showToast } from '$lib/stores/toast.svelte';
import { userStore } from '$lib/stores/user.svelte';

/**
 * Clipboard write with execCommand fallback for Android WebViews
 * where navigator.clipboard may not be granted permission.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

export async function downloadExpandedImage(
  e: Event,
  expandedImageUrl: string | null,
  options?: {
    pageName?: string;
    section?: string;
    productId?: string;
  }
) {
  e.stopPropagation();

  if (!expandedImageUrl) return;

  const filename = 'glance-look.jpg';

  try {
    // Cross-origin CDN images don't return CORS headers, so go through our
    // same-origin proxy which sets Content-Disposition: attachment and
    // streams the bytes back. See src/routes/api/download/+server.ts.
    // The proxy requires a Bearer token; guest and Google sessions both qualify.
    const accessToken = userStore.accessToken;
    if (!accessToken) {
      throw new Error('Not authenticated');
    }
    const proxyUrl = `/api/download?url=${encodeURIComponent(expandedImageUrl)}&filename=${encodeURIComponent(filename)}`;
    const response = await fetch(proxyUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error(`Download proxy returned ${response.status}`);
    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);

    // Track successful download
    if (options) {
      trackEvent(AnalyticsEventAction.CLICKED, {
        [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
        [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.DOWNLOAD_BUTTON_CLICK,
        [ANALYTICS_EVENT_KEYS.pageName]: options.pageName,
        [ANALYTICS_EVENT_KEYS.section]: options.section,
        [ANALYTICS_EVENT_KEYS.productId]: options.productId,
        [ANALYTICS_EVENT_KEYS.downloadMethod]: 'browser_download',
        [ANALYTICS_EVENT_KEYS.downloadStatus]: STATUS.SUCCESS,
      });
    }
  } catch (error) {
    showToast('Download failed. Please try again.', 'error');
    console.error('Download failed:', error);

    // Track failed download
    if (options) {
      trackEvent(AnalyticsEventAction.CLICKED, {
        [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
        [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.DOWNLOAD_BUTTON_CLICK,
        [ANALYTICS_EVENT_KEYS.pageName]: options.pageName,
        [ANALYTICS_EVENT_KEYS.section]: options.section,
        [ANALYTICS_EVENT_KEYS.productId]: options.productId,
        [ANALYTICS_EVENT_KEYS.downloadMethod]: 'browser_download',
        [ANALYTICS_EVENT_KEYS.downloadStatus]: STATUS.FAILED,
        [ANALYTICS_EVENT_KEYS.errorMessage]: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export async function shareExpandedImage(
  e: Event,
  expandedImageUrl: string | null,
  options?: {
    pageName?: string;
    section?: string;
    productId?: string;
  }
) {
  e.stopPropagation();

  if (!expandedImageUrl) return;

  try {
    const trackShare = (method: string) => {
      if (options) {
        trackEvent(AnalyticsEventAction.CLICKED, {
          [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
          [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.SHARE_BUTTON_CLICK,
          [ANALYTICS_EVENT_KEYS.pageName]: options.pageName,
          [ANALYTICS_EVENT_KEYS.section]: options.section,
          [ANALYTICS_EVENT_KEYS.productId]: options.productId,
          [ANALYTICS_EVENT_KEYS.shareMethod]: method,
          [ANALYTICS_EVENT_KEYS.shareStatus]: STATUS.SUCCESS,
        });
      }
    };

    if (navigator.canShare && navigator.canShare({ url: expandedImageUrl })) {
      await navigator.share({
        title: 'Check out this look',
        text: 'Found this cool look on Glance AI',
        url: expandedImageUrl,
      });
      trackShare('native_share');
    } else {
      const copied = await copyToClipboard(expandedImageUrl);
      if (copied) {
        showToast('Link copied to clipboard', 'success');
        trackShare('clipboard');
      } else {
        showToast('Unable to share. Try long-pressing the image.', 'error');
      }
    }
  } catch (err) {
    console.error('Share failed', err);

    // Track failed share
    if (options) {
      trackEvent(AnalyticsEventAction.CLICKED, {
        [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
        [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.SHARE_BUTTON_CLICK,
        [ANALYTICS_EVENT_KEYS.pageName]: options.pageName,
        [ANALYTICS_EVENT_KEYS.section]: options.section,
        [ANALYTICS_EVENT_KEYS.productId]: options.productId,
        [ANALYTICS_EVENT_KEYS.shareMethod]: navigator.canShare ? 'native_share' : 'clipboard',
        [ANALYTICS_EVENT_KEYS.shareStatus]: STATUS.FAILED,
        [ANALYTICS_EVENT_KEYS.errorMessage]: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }
}
