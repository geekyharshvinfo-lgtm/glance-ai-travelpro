<script lang="ts">
  import { getOptimizedImageUrl } from '$lib/utils/imageOptimization';

  interface OptimizedImageProps {
    src: string | undefined;
    alt?: string;
    class?: string;
    loading?: 'lazy' | 'eager';
    decoding?: 'async' | 'sync' | 'auto';
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    objectPosition?: string;
    onload?: () => void;
    onOptimized?: (url: string) => void; // Callback with optimized URL
    preloadUrl?: string; // Preloaded optimized URL to use immediately (e.g., for hero images)
  }

  let {
    src,
    alt = '',
    class: className = '',
    loading = 'lazy',
    decoding = 'async',
    objectFit = 'cover',
    objectPosition = 'center',
    onload,
    onOptimized,
    preloadUrl,
  }: OptimizedImageProps = $props();

  // Runtime dimension measurement
  let measuredWidth = $state(0);
  let measuredHeight = $state(0);

  // Stable dimensions - only update once measured
  let stableWidth = $state(0);
  let stableHeight = $state(0);

  // Track if dimensions have been locked to prevent multiple updates
  let dimensionsLocked = $state(false);

  // Track if optimized image failed to load
  let useFallback = $state(false);

  // Update stable dimensions only when measured dimensions are valid
  $effect(() => {
    if (measuredWidth > 0 && measuredHeight > 0 && !dimensionsLocked) {
      stableWidth = measuredWidth;
      stableHeight = measuredHeight;
      dimensionsLocked = true; // Lock to prevent any future updates
    }
  });

  // Optimize image URL based on stable dimensions
  // If preloadUrl is provided, use it and stick with it (no recalculation)
  // Otherwise wait for dimension measurement and calculate optimized URL
  const optimizedSrc = $derived(
    useFallback
      ? src
      : preloadUrl
        ? preloadUrl
        : getOptimizedImageUrl(src, stableWidth, stableHeight)
  );

  $effect(() => {
    if (optimizedSrc && optimizedSrc !== src && !useFallback) {
      // Notify parent component of optimized URL
      onOptimized?.(optimizedSrc);
    }
  });

  // Handle image load error - fallback to original image
  function handleImageError() {
    if (!useFallback && src) {
      console.warn('Optimized image failed to load, falling back to original:');
      useFallback = true;
    }
  }
</script>

<div
  class="optimized-image-container {className}"
  bind:clientWidth={measuredWidth}
  bind:clientHeight={measuredHeight}
>
  {#if optimizedSrc && (preloadUrl || dimensionsLocked || useFallback)}
    <img
      src={optimizedSrc}
      {alt}
      class="optimized-image"
      style="object-fit: {objectFit}; object-position: {objectPosition};"
      {loading}
      {decoding}
      {onload}
      onerror={handleImageError}
    />
  {/if}
</div>

<style>
  .optimized-image-container {
    position: relative;
    display: block;
    overflow: hidden;
    width: 100%;
    height: 100%;
  }

  .optimized-image {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
