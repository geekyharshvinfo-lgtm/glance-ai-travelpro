<script lang="ts">
  interface Props {
    width?: string | number;
    height?: string | number;
    class?: string;
  }

  let { width = 82, height = 82, class: className = '' }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  {width}
  {height}
  viewBox="0 0 82 82"
  fill="none"
  class={className}
>
  <g filter="url(#error_glow_blur)">
    <circle cx="41" cy="41" r="24" fill="#DC4444" fill-opacity="0.26" />
  </g>
  <defs>
    <filter id="error_glow_blur" x="-23" y="-23" width="128" height="128" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
      <feGaussianBlur stdDeviation="20" result="effect1_foregroundBlur" />
    </filter>
  </defs>
</svg>
