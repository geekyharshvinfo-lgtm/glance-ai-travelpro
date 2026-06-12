<script lang="ts">
  interface Props {
    width?: string | number;
    height?: string | number;
    class?: string;
  }

  let { width = 77, height = 77, class: className = '' }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  {width}
  {height}
  viewBox="0 0 77 77"
  fill="none"
  class={className}
>
  <circle cx="38.5" cy="38.5" r="38.5" fill="url(#paint0_linear_avatar_bg)" />
  <defs>
    <linearGradient
      id="paint0_linear_avatar_bg"
      x1="38.5"
      y1="0"
      x2="38.5"
      y2="77"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="#111111" />
      <stop offset="1" stop-color="#000000" />
    </linearGradient>
  </defs>
</svg>
