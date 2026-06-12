<script lang="ts">
  interface CameraGradientIconProps {
    width?: number | string;
    height?: number | string;
    strokeWidth?: number | string;
  }

  let { width = 66, height = 66, strokeWidth = 1.90646 }: CameraGradientIconProps = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" {width} {height} viewBox="0 0 66 66" fill="none">
  <path
    d="M24.4258 43.418C26.7325 45.1277 29.5413 46.1318 32.5672 46.1318C35.5931 46.1318 38.402 45.1277 40.7087 43.418"
    stroke="url(#paint0_linear_camera)"
    stroke-width={strokeWidth}
    stroke-linecap="round"
  />
  <path
    d="M40.706 32.5653C42.2048 32.5653 43.4198 30.7428 43.4198 28.4946C43.4198 26.2464 42.2048 24.4238 40.706 24.4238C39.2072 24.4238 37.9922 26.2464 37.9922 28.4946C37.9922 30.7428 39.2072 32.5653 40.706 32.5653Z"
    fill="url(#paint1_linear_camera)"
  />
  <path
    d="M24.4228 32.5653C25.9216 32.5653 27.1366 30.7428 27.1366 28.4946C27.1366 26.2464 25.9216 24.4238 24.4228 24.4238C22.924 24.4238 21.709 26.2464 21.709 28.4946C21.709 30.7428 22.924 32.5653 24.4228 32.5653Z"
    fill="url(#paint2_linear_camera)"
  />
  <path
    d="M59.7041 37.9916C59.7041 48.2254 59.7041 53.3437 56.5235 56.5216C53.3456 59.7022 48.2274 59.7022 37.9936 59.7022M27.1383 59.7022C16.9045 59.7022 11.7862 59.7022 8.60833 56.5216C5.42773 53.3437 5.42773 48.2254 5.42773 37.9916M27.1383 5.42578C16.9045 5.42578 11.7862 5.42578 8.60833 8.60638C5.42773 11.7843 5.42773 16.9025 5.42773 27.1363M37.9936 5.42578C48.2274 5.42578 53.3456 5.42578 56.5235 8.60638C59.7041 11.7843 59.7041 16.9025 59.7041 27.1363"
    stroke="url(#paint3_linear_camera)"
    stroke-width={strokeWidth}
    stroke-linecap="round"
  />
  <defs>
    <linearGradient
      id="paint0_linear_camera"
      x1="32.5672"
      y1="43.418"
      x2="32.5672"
      y2="46.1318"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="white" />
      <stop offset="1" stop-color="white" />
    </linearGradient>
    <linearGradient
      id="paint1_linear_camera"
      x1="40.706"
      y1="24.4238"
      x2="40.706"
      y2="32.5653"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="white" />
      <stop offset="1" stop-color="white" />
    </linearGradient>
    <linearGradient
      id="paint2_linear_camera"
      x1="24.4228"
      y1="24.4238"
      x2="24.4228"
      y2="32.5653"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="white" />
      <stop offset="1" stop-color="white" />
    </linearGradient>
    <linearGradient
      id="paint3_linear_camera"
      x1="32.5659"
      y1="5.42578"
      x2="32.5659"
      y2="59.7022"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="white" stop-opacity="0.4" />
      <stop offset="1" stop-color="white" />
    </linearGradient>
  </defs>
</svg>
