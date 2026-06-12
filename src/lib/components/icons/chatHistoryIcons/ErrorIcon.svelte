<script lang="ts">
  interface Props {
    width?: string | number;
    height?: string | number;
    class?: string;
  }

  let { width = 24, height = 24, class: className = '' }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  {width}
  {height}
  viewBox="0 0 24 24"
  fill="none"
  class={className}
>
  <circle cx="11.9984" cy="12.0004" r="9.6" fill="black" fill-opacity="0.07" />
  <path
    d="M12 16.99V17M12 7V14M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
    stroke="url(#error_icon_grad)"
    stroke-width="1.215"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <defs>
    <linearGradient id="error_icon_grad" x1="5.4" y1="3.9" x2="17.7" y2="22.5" gradientUnits="userSpaceOnUse">
      <stop stop-color="white" />
      <stop offset="0.533846" stop-color="#9C9999" />
      <stop offset="1" stop-color="white" />
    </linearGradient>
  </defs>
</svg>
