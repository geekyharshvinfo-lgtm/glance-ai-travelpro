<script lang="ts">
  interface Props {
    statusCode: number;
    is404: boolean;
    label: string;
    message: string;
    subtitle: string;
    sentryId?: string;
  }

  let { statusCode, is404, label, message, subtitle, sentryId }: Props = $props();
</script>

<div class="error-page">
  <div class="grain"></div>

  <div class="accent-line"></div>

  <div class="content">
    <p class="label">{label}</p>

    <h1 class="status-code">
      {#each String(statusCode).split('') as digit, i (i)}
        <span class="digit" style="animation-delay: {i * 120}ms">{digit}</span>
      {/each}
    </h1>

    <p class="message">{message}</p>
    <p class="subtitle" class:subtitle-terminal={is404}>{subtitle}</p>

    {#if !is404}
      <button class="refresh-button" onclick={() => location.reload()}>
        <svg class="refresh-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13.65 2.35A7.96 7.96 0 0 0 8 0a8 8 0 1 0 8 8h-2a6 6 0 1 1-1.76-4.24L9.5 6.5H16V0l-2.35 2.35Z" fill="currentColor"/>
        </svg>
        Refresh page
      </button>
    {/if}

    {#if sentryId}
      <p class="sentry-id">Ref: {sentryId}</p>
    {/if}
  </div>

  <p class="footer-mark">AI Influencer</p>
</div>

<style>
  .error-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100dvh;
    padding: 2rem 1.5rem;
    position: relative;
    overflow: hidden;
    background: #111;
  }

  .grain {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    opacity: 0.035;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 180px;
  }

  .accent-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(91deg, #765aea 0%, #d45fda 100%);
    animation: line-reveal 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    transform-origin: left;
    scale: 0 1;
  }

  @keyframes line-reveal {
    to {
      scale: 1 1;
    }
  }

  .content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 22rem;
  }

  .label {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: rgba(138, 109, 255, 0.8);
    margin-bottom: 1.25rem;
    animation: fade-up 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
    translate: 0 8px;
  }

  .status-code {
    font-family: 'Playfair Display', serif;
    font-size: 8rem;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.04em;
    margin-bottom: 1.5rem;
    background: linear-gradient(180deg, #fff 30%, rgba(255, 255, 255, 0.25) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .digit {
    display: inline-block;
    animation: digit-rise 700ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
    translate: 0 40px;
  }

  @keyframes digit-rise {
    to {
      opacity: 1;
      translate: 0 0;
    }
  }

  .message {
    font-size: 1.125rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.4;
    margin-bottom: 0.5rem;
    animation: fade-up 600ms 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
    translate: 0 8px;
  }

  .subtitle {
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.4);
    line-height: 1.5;
    margin-bottom: 2.5rem;
    animation: fade-up 600ms 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
    translate: 0 8px;
  }

  /* No button follows on 404, so remove excess bottom margin */
  .subtitle-terminal {
    margin-bottom: 0;
  }

  .refresh-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.75rem;
    border-radius: 2rem;
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: #fff;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition:
      background 250ms ease,
      border-color 250ms ease;
    animation: fade-up 600ms 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
    translate: 0 8px;
  }

  .refresh-button:hover,
  .refresh-button:active {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .refresh-icon {
    transition: rotate 300ms ease;
  }

  .refresh-button:hover .refresh-icon,
  .refresh-button:active .refresh-icon {
    rotate: 90deg;
  }

  @keyframes fade-up {
    to {
      opacity: 1;
      translate: 0 0;
    }
  }

  .sentry-id {
    margin-top: 2rem;
    font-size: 0.625rem;
    font-family: monospace;
    color: rgba(255, 255, 255, 0.2);
    animation: fade-up 600ms 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
  }

  .footer-mark {
    position: absolute;
    bottom: 1.5rem;
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.25em;
    color: rgba(255, 255, 255, 0.1);
  }
</style>
