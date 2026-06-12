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
  <g filter="url(#filter0_i_1257_7423)">
    <path
      d="M38.3733 46.6999V48.8C38.3733 49.9139 37.9256 50.9822 37.1288 51.7698C36.3319 52.5575 35.2512 53 34.1243 53H29.8752C28.7483 53 27.6676 52.5575 26.8707 51.7698C26.0739 50.9822 25.6262 49.9139 25.6262 48.8V46.6999H38.3733ZM17.1282 44.5999C15.2374 44.5999 14.2878 42.3382 15.6262 41.0152L21.6917 35.0154L18.5814 33.9927C18.2584 33.8865 17.966 33.7051 17.7287 33.4639C17.4914 33.2226 17.3163 32.9286 17.218 32.6064C17.1197 32.2843 17.1011 31.9435 17.1639 31.6128C17.2267 31.2821 17.3689 30.9712 17.5786 30.7062L17.7486 30.5151L24.1625 24.173L22.5521 23.3771C22.2712 23.2382 22.025 23.0396 21.8312 22.7954C21.6373 22.5512 21.5007 22.2676 21.431 21.965C21.3613 21.6623 21.3603 21.3482 21.4282 21.0451C21.496 20.7421 21.631 20.4577 21.8234 20.2123L21.9997 20.0149L30.4977 11.6149C30.8961 11.2212 31.4364 11 31.9998 11C32.5631 11 33.1034 11.2212 33.5018 11.6149L41.9998 20.0149C42.2376 20.2503 42.4154 20.538 42.5187 20.8546C42.622 21.1711 42.6477 21.5074 42.5937 21.8357C42.5398 22.164 42.4078 22.4749 42.2085 22.7429C42.0092 23.0109 41.7483 23.2282 41.4474 23.3771L39.8349 24.173L46.2509 30.5151C46.4913 30.753 46.6703 31.0446 46.773 31.3652C46.8756 31.6858 46.8989 32.026 46.8408 32.3574C46.7827 32.6887 46.645 33.0014 46.4392 33.2692C46.2334 33.5369 45.9655 33.7519 45.6582 33.8961L45.4181 33.9927L42.3057 35.0154L48.3733 41.0152C49.6544 42.2794 48.8407 44.4046 47.1135 44.5873L46.8713 44.5999H17.1282Z"
      fill="url(#paint0_linear_1257_7423)"
    />
  </g>
  <g filter="url(#filter1_i_1257_7423)">
    <path
      d="M31.5746 14.2324C27.166 14.2324 24.8594 15.4024 24.1433 15.8459C23.8691 16.0158 23.5133 16.0063 23.2595 15.8071C23.0959 15.6786 22.9962 15.501 23.0001 15.3058C23.1377 8.27704 27.7001 4.4834 35.1426 4.4834C40.3201 4.4834 44.4148 7.01211 44.4148 9.76311C44.4148 10.1203 44.4148 8.60106 41.8657 8.60106C40.1638 8.60106 40.048 12.1357 40.0401 15.3415C40.0397 15.5016 39.9696 15.6488 39.8522 15.7662C39.5957 16.0223 39.1888 16.0493 38.8843 15.8528C38.1737 15.3945 35.9417 14.2324 31.5746 14.2324Z"
      fill="#FF473E"
    />
  </g>
  <g filter="url(#filter2_i_1257_7423)">
    <path
      d="M45.8455 10.0941C45.8455 11.0393 45.0794 11.8055 44.1342 11.8055C43.189 11.8055 42.4229 11.0393 42.4229 10.0941C42.4229 9.14898 43.189 8.38281 44.1342 8.38281C45.0794 8.38281 45.8455 9.14898 45.8455 10.0941Z"
      fill="white"
    />
  </g>
  <defs>
    <filter
      id="filter0_i_1257_7423"
      x="15"
      y="11"
      width="34"
      height="43.6895"
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
      <feOffset dy="1.68953" />
      <feGaussianBlur stdDeviation="2.25589" />
      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
      <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
      <feBlend mode="normal" in2="shape" result="effect1_innerShadow_1257_7423" />
    </filter>
    <filter
      id="filter1_i_1257_7423"
      x="23"
      y="4.4834"
      width="21.415"
      height="13.1876"
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
      <feOffset dy="1.68953" />
      <feGaussianBlur stdDeviation="2.25589" />
      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
      <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
      <feBlend mode="normal" in2="shape" result="effect1_innerShadow_1257_7423" />
    </filter>
    <filter
      id="filter2_i_1257_7423"
      x="42.4229"
      y="8.38281"
      width="3.42285"
      height="5.11238"
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
      <feOffset dy="1.68953" />
      <feGaussianBlur stdDeviation="2.25589" />
      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
      <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.376471 0 0 0 0 0.345098 0 0 0 1 0" />
      <feBlend mode="normal" in2="shape" result="effect1_innerShadow_1257_7423" />
    </filter>
    <linearGradient
      id="paint0_linear_1257_7423"
      x1="32"
      y1="11"
      x2="32"
      y2="53"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="#5C913B" />
      <stop offset="1" stop-color="#88D856" />
    </linearGradient>
  </defs>
</svg>
