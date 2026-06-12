<script lang="ts">
  interface YoutubeIconProps {
    width?: number | string;
    height?: number | string;
    fill?: string;
  }

  let { width = 24, height = 24, fill = 'white' }: YoutubeIconProps = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" {width} {height} viewBox="0 0 24 24" fill="none">
  <mask
    id="mask0_2932_8393"
    style="mask-type:luminance"
    maskUnits="userSpaceOnUse"
    x="2"
    y="4"
    width="20"
    height="16"
  >
    <path
      d="M12 5C21 5 21 5 21 12C21 19 21 19 12 19C3 19 3 19 3 12C3 5 3 5 12 5Z"
      fill="white"
      stroke="white"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path d="M10 8.5L16 12L10 15.5V8.5Z" fill="black" />
  </mask>
  <g mask="url(#mask0_2932_8393)">
    <path d="M0 0H24V24H0V0Z" {fill} />
  </g>
</svg>
