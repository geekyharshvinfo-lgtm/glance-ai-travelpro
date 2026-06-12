<script lang="ts">
  interface Props {
    width?: number | string;
    height?: number | string;
    class?: string;
  }

  let { width = 40, height = 40, class: className = '' }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  {width}
  {height}
  viewBox="0 0 40 40"
  fill="none"
  class={className}
>
  <circle cx="19.5273" cy="20" r="18" fill="url(#paint0_linear_3047_19618)" fill-opacity="0.49" />
  <path
    d="M25 16L17.6684 24.7215L14 21.5"
    stroke="white"
    stroke-width="2.93961"
    stroke-linecap="round"
  />
  <defs>
    <linearGradient
      id="paint0_linear_3047_19618"
      x1="18.2386"
      y1="4.24479"
      x2="19.5273"
      y2="38"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="#A3F3AA" />
      <stop offset="1" stop-color="#1B8109" />
    </linearGradient>
  </defs>
</svg>
