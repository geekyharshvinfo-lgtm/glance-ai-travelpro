<script lang="ts">
  interface Props {
    width?: string | number;
    height?: string | number;
    fill?: string;
    fillOpacity?: string | number;
    stroke?: string;
    strokeWidth?: string | number;
    class?: string;
  }

  let {
    width = 34,
    height = 35,
    fill = 'white',
    fillOpacity = 0.08,
    stroke = 'rgba(17, 17, 17, 0.22)',
    strokeWidth = 1.144,
    class: className = '',
  }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  {width}
  {height}
  viewBox="0 0 34 35"
  fill="none"
  class={className}
>
  <path
    d="M16.875 0.572144C25.888 0.572144 33.1787 8.00102 33.1787 17.1444C33.1787 26.2878 25.888 33.7167 16.875 33.7167C7.86213 33.7165 0.572266 26.2877 0.572266 17.1444C0.572266 8.00113 7.86213 0.572334 16.875 0.572144Z"
    {fill}
    fill-opacity={fillOpacity}
    {stroke}
    stroke-width={strokeWidth}
  />
  <defs>
    <linearGradient
      id="paint0_linear_circle_bg"
      x1="6.23083"
      y1="1.14441"
      x2="33.0594"
      y2="61.0511"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="#111111" stop-opacity="0.22" />
      <stop offset="1" stop-color="#111111" stop-opacity="0" />
    </linearGradient>
  </defs>
</svg>
