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
  <g filter="url(#swim_filter0)">
    <path d="M56.1903 4H8V8.73564H56.1903V4Z" fill="url(#swim_paint0)"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M8 10.5615V41.5148C8.10774 41.4704 8.22522 41.4454 8.34939 41.4454H33.1987V10.5615H8ZM20.1319 23.968L13.3261 28.7231C12.427 29.3507 12.0399 30.4889 12.3692 31.5347C12.6979 32.5804 13.6675 33.2914 14.7638 33.2914C18.5079 33.2914 23.5819 33.2914 27.3266 33.2914C28.4229 33.2914 29.3919 32.5804 29.7212 31.5347C30.0505 30.4889 29.6628 29.3507 28.7644 28.7231L21.9579 23.968V22.7512C23.6331 22.3416 24.8779 20.829 24.8779 19.0285C24.8779 16.9132 23.1601 15.1955 21.0449 15.1955C18.9297 15.1955 17.2126 16.9132 17.2126 19.0285C17.2126 19.5324 17.6216 19.9415 18.1256 19.9415C18.6296 19.9415 19.0387 19.5324 19.0387 19.0285C19.0387 17.9206 19.9377 17.0216 21.0449 17.0216C22.1527 17.0216 23.0518 17.9206 23.0518 19.0285C23.0518 20.1357 22.1527 21.0347 21.0449 21.0347C20.5409 21.0347 20.1319 21.4444 20.1319 21.9477V23.968Z" fill="url(#swim_paint1)"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M21.0458 25.5586L27.7196 30.2206C27.9643 30.3916 28.0702 30.7021 27.9801 30.9869C27.8906 31.2724 27.6264 31.466 27.3276 31.466H14.7647C14.4659 31.466 14.2017 31.2724 14.1116 30.9869C14.0221 30.7021 14.1274 30.3916 14.3727 30.2206L21.0458 25.5586Z" fill="url(#swim_paint2)"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M8 43.2021V50.3354C8.10774 50.291 8.22522 50.266 8.34939 50.266H33.1987V43.2715H8.34939C8.22522 43.2715 8.10774 43.2472 8 43.2021ZM18.6527 47.992H23.459C23.963 47.992 24.372 47.5829 24.372 47.0789C24.372 46.5749 23.963 46.1659 23.459 46.1659H18.6527C18.1487 46.1659 17.7397 46.5749 17.7397 47.0789C17.7397 47.5829 18.1487 47.992 18.6527 47.992Z" fill="url(#swim_paint3)"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M8 52.0225V59.9994H33.1987V52.0919H8.34939C8.22522 52.0919 8.10774 52.0675 8 52.0225ZM18.6527 56.6899H23.459C23.963 56.6899 24.372 56.2803 24.372 55.7769C24.372 55.2729 23.963 54.8638 23.459 54.8638H18.6527C18.1487 54.8638 17.7397 55.2729 17.7397 55.7769C17.7397 56.2803 18.1487 56.6899 18.6527 56.6899Z" fill="url(#swim_paint4)"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M56.1909 59.9996H35.0254V10.5615H56.1909V59.9996ZM37.4449 31.0404V35.784C37.4449 36.2873 37.854 36.697 38.358 36.697C38.862 36.697 39.271 36.2873 39.271 35.784V31.0404C39.271 30.5364 38.862 30.1274 38.358 30.1274C37.854 30.1274 37.4449 30.5364 37.4449 31.0404Z" fill="url(#swim_paint5)"/>
  </g>
  <defs>
    <filter id="swim_filter0" x="8" y="4" width="48.1914" height="58.0645" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dy="2.06452"/>
      <feGaussianBlur stdDeviation="1.72043"/>
      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
      <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/>
      <feBlend mode="normal" in2="shape" result="swim_innerShadow"/>
    </filter>
    <linearGradient id="swim_paint0" x1="56.0976" y1="7.46666" x2="22.5381" y2="-25.8504" gradientUnits="userSpaceOnUse">
      <stop stop-color="#D760FF"/>
      <stop offset="1" stop-color="#5624DD"/>
    </linearGradient>
    <linearGradient id="swim_paint1" x1="33.1502" y1="33.2205" x2="-1.47527" y2="30.4705" gradientUnits="userSpaceOnUse">
      <stop stop-color="#D760FF"/>
      <stop offset="1" stop-color="#5624DD"/>
    </linearGradient>
    <linearGradient id="swim_paint2" x1="27.9851" y1="29.883" x2="9.6892" y2="25.6735" gradientUnits="userSpaceOnUse">
      <stop stop-color="#D760FF"/>
      <stop offset="1" stop-color="#5624DD"/>
    </linearGradient>
    <linearGradient id="swim_paint3" x1="33.1502" y1="48.424" x2="2.00547" y2="37.6904" gradientUnits="userSpaceOnUse">
      <stop stop-color="#D760FF"/>
      <stop offset="1" stop-color="#5624DD"/>
    </linearGradient>
    <linearGradient id="swim_paint4" x1="33.1502" y1="57.8619" x2="1.32867" y2="48.0549" gradientUnits="userSpaceOnUse">
      <stop stop-color="#D760FF"/>
      <stop offset="1" stop-color="#5624DD"/>
    </linearGradient>
    <linearGradient id="swim_paint5" x1="56.1502" y1="46.752" x2="26.9342" y2="45.5318" gradientUnits="userSpaceOnUse">
      <stop stop-color="#D760FF"/>
      <stop offset="1" stop-color="#5624DD"/>
    </linearGradient>
  </defs>
</svg>
