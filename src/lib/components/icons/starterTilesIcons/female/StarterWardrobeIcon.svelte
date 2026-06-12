<script lang="ts">
  interface Props {
    width?: string | number;
    height?: string | number;
    class?: string;
  }

  let { width = 64, height = 64, class: className = '' }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  {width}
  {height}
  viewBox="0 0 64 64"
  fill="none"
  class={className}
>
  <g filter="url(#filter0_i_1257_7411)">
    <path
      d="M26.2992 11L24.4092 11.9638C24.4092 14.9961 24.4836 20.2816 25.7033 24.3619C31.1314 25.7062 33.8686 25.7062 39.2967 24.3619C40.535 20.291 40.5908 16.1691 40.6001 11.9638L38.7008 11C38.2911 11.5434 37.6115 12.4239 36.6711 13.5154C36.0008 14.2879 35.2932 15.0642 34.6135 15.6739C34.2783 15.9788 33.9524 16.242 33.6266 16.4474C33.2914 16.6557 32.9655 16.8355 32.5 16.8355C32.0345 16.8355 31.7086 16.6557 31.3734 16.4474C31.0476 16.242 30.7217 15.9788 30.3865 15.6739C29.7068 15.0642 28.9992 14.2879 28.3289 13.5154C27.3885 12.4239 26.7089 11.5434 26.2992 11ZM25.4985 26.0565L14 49.4498C14.0261 49.554 14.0745 49.6676 14.2011 49.8096C14.3873 50.0273 14.7206 50.2924 15.189 50.5385C16.1275 51.0498 17.5836 51.5137 19.3535 51.8829C22.8915 52.6213 27.7051 53 32.5 53C37.2949 53 42.1085 52.6213 45.6465 51.8829C47.4155 51.5137 48.8772 51.0498 49.8083 50.5385C50.2831 50.2924 50.609 50.0273 50.7952 49.8096C50.9255 49.6676 50.9721 49.554 51 49.4498L39.5015 26.0565C34.1014 27.3725 30.8986 27.3725 25.4985 26.0565Z"
      fill="url(#paint0_linear_1257_7411)"
    />
  </g>
  <defs>
    <filter
      id="filter0_i_1257_7411"
      x="14"
      y="11"
      width="37"
      height="44.2857"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB"
    >
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
      <feColorMatrix
        in="SourceAlpha"
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        result="hardAlpha"
      />
      <feOffset dy="2.28571" />
      <feGaussianBlur stdDeviation="1.90476" />
      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
      <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
      <feBlend mode="normal" in2="shape" result="effect1_innerShadow_1257_7411" />
    </filter>
    <linearGradient
      id="paint0_linear_1257_7411"
      x1="50.9288"
      y1="41.7456"
      x2="0.141612"
      y2="37.3806"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="#D760FF" />
      <stop offset="1" stop-color="#5624DD" />
    </linearGradient>
  </defs>
</svg>
