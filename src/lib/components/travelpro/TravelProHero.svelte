<script lang="ts">
  interface Props {
    generatedUrl: string | null;
    status: 'pending' | 'generating' | 'done' | 'error';
    selfieDataUrl: string | null;
  }

  let { generatedUrl, status, selfieDataUrl }: Props = $props();
</script>

<!-- Mirrors the hero section layout from HeroSection.svelte -->
<section class="hero">
  <div class="hero-image-wrap">
    {#if status === 'done' && generatedUrl}
      <img src={generatedUrl} alt="Your TravelPro hero look" class="hero-img" />
    {:else}
      <!-- While generating: blurred selfie bg -->
      {#if selfieDataUrl}
        <img src={selfieDataUrl} alt="" class="hero-bg" />
      {:else}
        <div class="hero-bg-placeholder"></div>
      {/if}
      <div class="hero-loader-overlay">
        <div class="loader-ring"></div>
        <p class="loader-text">Creating your look…</p>
      </div>
    {/if}
    <div class="hero-gradient"></div>
    <div class="hero-copy">
      <p class="hero-eyebrow">Your TravelPro Journey</p>
      <h1 class="hero-title">The World<br />Awaits.</h1>
    </div>
  </div>
</section>

<style>
  .hero {
    position: relative;
    padding-top: 4.875rem;
  }

  .hero-image-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 9/14;
    max-height: 92vh;
    overflow: hidden;
    background: #1a1a1a;
  }

  .hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .hero-bg {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    filter: blur(20px) brightness(0.25);
    transform: scale(1.1);
  }

  .hero-bg-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }

  .hero-loader-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .loader-ring {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    border: 2px solid rgba(138,109,255,0.1);
    border-top-color: rgba(138,109,255,0.55);
    animation: spin 0.85s linear infinite;
  }

  .loader-text {
    font-size: 0.8125rem;
    font-weight: 500;
    color: rgba(255,255,255,0.45);
    letter-spacing: 0.04em;
  }

  @keyframes spin { to { rotate: 360deg; } }

  .hero-gradient {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 40%;
    background: linear-gradient(to top, rgba(17,17,17,0.95) 0%, transparent 100%);
    pointer-events: none;
  }

  .hero-copy {
    position: absolute;
    bottom: 2rem;
    left: 1.25rem;
    right: 1.25rem;
  }

  .hero-eyebrow {
    font-size: 0.7rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
    margin-bottom: 0.4rem;
  }

  .hero-title {
    font-family: 'Playfair Display';
    font-size: 2.5rem;
    font-weight: 400;
    line-height: 1.1;
    color: white;
  }
</style>
