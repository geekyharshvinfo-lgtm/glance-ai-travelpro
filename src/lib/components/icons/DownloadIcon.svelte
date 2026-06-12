<script lang="ts">
  interface Props {
    width?: string | number;
    height?: string | number;
    class?: string;
    stroke?: string;
  }

  let { width = 16, height = 16, class: className = '', stroke = 'white' }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  {width}
  {height}
  viewBox="0 0 16 16"
  fill="none"
  class={className}
>
  <path
    d="M13.3327 9.66699V13.0003C13.3327 13.7367 12.7357 14.3337 11.9993 14.3337H3.99935C3.26297 14.3337 2.66602 13.7367 2.66602 13.0003V9.66699"
    stroke={stroke}
    stroke-width="1.3"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <path
    d="M10.6673 7.26693L8.00065 9.93359M8.00065 9.93359L5.33398 7.26693M8.00065 9.93359V1.93359"
    stroke={stroke}
    stroke-width="1.3"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <defs>
    <linearGradient
      id="paint0_linear_1257_7847"
      x1="7.99935"
      y1="9.66699"
      x2="7.99935"
      y2="14.3337"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="white" stop-opacity="0.64" />
      <stop offset="1" stop-color="white" />
    </linearGradient>
    <linearGradient
      id="paint1_linear_1257_7847"
      x1="8.00065"
      y1="9.93359"
      x2="8.00065"
      y2="1.93359"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="white" stop-opacity="0.64" />
      <stop offset="1" stop-color="white" />
    </linearGradient>
  </defs>
</svg>
