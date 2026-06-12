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
  <g filter="url(#sfc_male_filter0)">
    <path d="M16.6695 20.1143C16.6695 20.1143 3.32884 18.2659 2.12336 29.4366C1.48044 35.7855 3.4092 39.8841 6.54345 41.7325L17.9553 20.275C17.5535 20.275 17.1517 20.1946 16.6695 20.1143Z" fill="url(#sfc_male_paint0)"/>
    <path d="M48.335 20.114C41.0217 19.8729 36.4409 22.9268 35.5569 25.177C35.3962 25.5789 35.3962 26.1414 35.4765 26.7843C34.3514 26.2218 33.2263 25.7396 32.0208 25.7396C30.9761 25.7396 30.0117 26.1414 29.0473 26.5432C29.0473 26.4629 29.0473 26.3825 29.0473 26.3021C28.4847 24.293 25.2701 21.641 19.8857 20.5962L8.15234 42.4556C10.1615 43.0985 12.4921 43.0181 14.8227 42.2145C21.6537 39.7231 25.5112 34.1779 25.5112 34.1779C25.5112 34.1779 28.6455 29.9186 29.0473 27.2665C29.9313 26.7843 30.9761 26.4629 31.9405 26.4629C33.3067 26.4629 34.5121 27.1058 35.7176 27.7487C36.4409 30.3204 38.2893 33.3743 38.2893 33.3743C38.2893 33.3743 39.977 36.1871 43.1916 38.9195L52.9961 20.5159C50.4244 19.9533 48.335 20.114 48.335 20.114Z" fill="url(#sfc_male_paint1)"/>
    <path d="M54.763 20.998L44.5566 40.0446C45.6818 40.8483 46.8872 41.6519 48.2534 42.2948C49.6196 42.9378 51.0662 43.2592 52.4324 43.3396H53.6379C58.2991 42.9377 62.1566 38.9195 61.9959 30.7222C61.8352 24.7752 58.2187 22.2035 54.763 20.998Z" fill="url(#sfc_male_paint2)"/>
  </g>
  <defs>
    <filter id="sfc_male_filter0" x="2" y="20" width="60" height="24.3396" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dy="1.35779"/>
      <feGaussianBlur stdDeviation="1.81295"/>
      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
      <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/>
      <feBlend mode="normal" in2="shape" result="sfc_male_innerShadow"/>
    </filter>
    <linearGradient id="sfc_male_paint0" x1="9.97765" y1="10.9448" x2="11.3813" y2="50.7382" gradientUnits="userSpaceOnUse">
      <stop stop-color="#E4C619"/>
      <stop offset="1" stop-color="#D8B536"/>
    </linearGradient>
    <linearGradient id="sfc_male_paint1" x1="30.5742" y1="10.5964" x2="31.1241" y2="52.3734" gradientUnits="userSpaceOnUse">
      <stop stop-color="#E4C619"/>
      <stop offset="1" stop-color="#D8B536"/>
    </linearGradient>
    <linearGradient id="sfc_male_paint2" x1="53.2787" y1="11.6891" x2="54.6357" y2="52.6035" gradientUnits="userSpaceOnUse">
      <stop stop-color="#E4C619"/>
      <stop offset="1" stop-color="#D8B536"/>
    </linearGradient>
  </defs>
</svg>
