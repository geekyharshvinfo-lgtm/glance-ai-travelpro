<script lang="ts">
  interface WarningIconProps {
    width?: number | string;
    height?: number | string;
    stroke?: string;
    strokeWidth?: number | string;
  }

  let {
    width = 18,
    height = 18,
    stroke = '#FFB06A',
    strokeWidth = 1.33333,
  }: WarningIconProps = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" {width} {height} viewBox="0 0 18 18" fill="none">
  <path
    d="M9.25 2.25L16.25 15.4722H2.25L9.25 2.25Z"
    {stroke}
    stroke-width={strokeWidth}
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <path
    d="M9.25 7.69434V10.8054"
    {stroke}
    stroke-width={strokeWidth}
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <path
    d="M9.25 13.1387V13.1453"
    {stroke}
    stroke-width={strokeWidth}
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
