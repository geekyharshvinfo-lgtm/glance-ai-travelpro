<script lang="ts">
  interface AlertCircleIconProps {
    width?: number | string;
    height?: number | string;
    stroke?: string;
    strokeOpacity?: number | string;
    strokeWidth?: number | string;
  }

  let {
    width = 12,
    height = 12,
    stroke = 'white',
    strokeOpacity = 0.6,
    strokeWidth = 0.8,
  }: AlertCircleIconProps = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" {width} {height} viewBox="0 0 12 12" fill="none">
  <path
    d="M6 10C8.20914 10 10 8.20914 10 6C10 3.79086 8.20914 2 6 2C3.79086 2 2 3.79086 2 6C2 8.20914 3.79086 10 6 10Z"
    {stroke}
    stroke-opacity={strokeOpacity}
    stroke-width={strokeWidth}
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <path
    d="M6 4V6"
    {stroke}
    stroke-opacity={strokeOpacity}
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <path
    d="M6 8H6.005"
    {stroke}
    stroke-opacity={strokeOpacity}
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
