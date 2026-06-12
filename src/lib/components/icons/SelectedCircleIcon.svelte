<script lang="ts">
  interface SelectedCircleIconProps {
    width?: number | string;
    height?: number | string;
    blurRadius?: number | string;
  }

  let { width = 88, height = 88, blurRadius = 7.05931 }: SelectedCircleIconProps = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" {width} {height} viewBox="0 0 88 88" fill="none">
  <foreignObject x="-7.05931" y="-7.05931" width="102.119" height="102.119">
    <div
      xmlns="http://www.w3.org/1999/xhtml"
      style="backdrop-filter:blur(3.5296547412872314px);clip-path:url(#bgblur_selected_circle_clip_path);height:100%;width:100%"
    ></div>
  </foreignObject>
  <circle
    data-figma-bg-blur-radius={blurRadius}
    cx="44"
    cy="44"
    r="43"
    fill="url(#paint0_linear_selected_circle)"
    stroke="url(#paint1_linear_selected_circle)"
    stroke-width="2"
  />
  <defs>
    <clipPath id="bgblur_selected_circle_clip_path" transform="translate(7.05931 7.05931)">
      <circle cx="44" cy="44" r="43" />
    </clipPath>
    <linearGradient
      id="paint0_linear_selected_circle"
      x1="13.56"
      y1="13.56"
      x2="74.44"
      y2="74.44"
      gradientUnits="userSpaceOnUse"
    >
      <stop offset="0.0524" stop-color="#7C7C7C" stop-opacity="0.32" />
      <stop offset="0.5101" stop-color="#7C7C7C" stop-opacity="0.20" />
    </linearGradient>
    <linearGradient
      id="paint1_linear_selected_circle"
      x1="-18.5387"
      y1="-6.3399"
      x2="-25.5605"
      y2="132.524"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="white" />
      <stop offset="0.241041" stop-color="white" stop-opacity="0" />
      <stop offset="0.49988" stop-color="white" stop-opacity="0.0404993" />
      <stop offset="1" stop-color="white" />
    </linearGradient>
  </defs>
</svg>
