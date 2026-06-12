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
  <g filter="url(#sdfo_male_filter0)">
    <path d="M11 22.9756V49.8506C11 52.2245 12.9261 54.1506 15.3 54.1506H49.7C52.0739 54.1506 54 52.2245 54 49.8506V22.9756H11ZM41.9015 36.9844L39.3462 39.9295C38.9654 40.3684 38.7773 40.944 38.8288 41.524L39.167 45.4074C39.2723 46.6191 38.0517 47.5059 36.9319 47.0311L33.3419 45.5105C32.8066 45.2843 32.1997 45.2843 31.6644 45.5105L28.0744 47.0311C26.9546 47.5059 25.734 46.6168 25.8393 45.4074L26.1775 41.524C26.229 40.944 26.0409 40.3684 25.6601 39.9295L23.1048 36.9844C22.3075 36.0662 22.7756 34.6306 23.9581 34.3552L27.7564 33.475C28.323 33.3428 28.8135 32.9868 29.1136 32.4895L31.1247 29.1481C31.7519 28.1067 33.2613 28.1067 33.8884 29.1481L35.8995 32.4895C36.1996 32.989 36.6901 33.3451 37.2567 33.475L41.055 34.3552C42.2398 34.6284 42.7056 36.0662 41.9083 36.9844H41.9015Z" fill="url(#sdfo_male_paint0)"/>
    <path d="M54 20.8246V16.5246C54 14.1507 52.0739 12.2246 49.7 12.2246H47.55V13.2996C47.55 15.6713 45.6217 17.5996 43.25 17.5996C40.8783 17.5996 38.95 15.6713 38.95 13.2996V12.2246H26.05V13.2996C26.05 15.6713 24.1217 17.5996 21.75 17.5996C19.3783 17.5996 17.45 15.6713 17.45 13.2996V12.2246H15.3C12.9261 12.2246 11 14.1507 11 16.5246V20.8246H54Z" fill="url(#sdfo_male_paint1)"/>
    <path d="M43.2496 9C44.4366 9 45.3996 10.187 45.3996 11.15V13.3C45.3996 14.487 44.4366 15.45 43.2496 15.45C42.0626 15.45 41.0996 14.263 41.0996 13.3V11.15C41.0996 9.96303 42.0626 9 43.2496 9Z" fill="url(#sdfo_male_paint2)"/>
    <path d="M21.7516 9C22.9385 9 23.9016 10.187 23.9016 11.15V13.3C23.9016 14.487 22.9385 15.45 21.7516 15.45C20.5646 15.45 19.6016 14.263 19.6016 13.3V11.15C19.6016 9.96303 20.5646 9 21.7516 9Z" fill="url(#sdfo_male_paint3)"/>
  </g>
  <defs>
    <filter id="sdfo_male_filter0" x="11" y="9" width="43" height="47.4361" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dy="2.28571"/>
      <feGaussianBlur stdDeviation="1.90476"/>
      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
      <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/>
      <feBlend mode="normal" in2="shape" result="sdfo_male_innerShadow"/>
    </filter>
    <linearGradient id="sdfo_male_paint0" x1="53.9173" y1="45.7968" x2="-4.48415" y2="37.9381" gradientUnits="userSpaceOnUse">
      <stop stop-color="#AFC62B"/>
      <stop offset="1" stop-color="#4C7217"/>
    </linearGradient>
    <linearGradient id="sdfo_male_paint1" x1="53.9173" y1="18.5201" x2="5.887" y2="-4.90896" gradientUnits="userSpaceOnUse">
      <stop stop-color="#AFC62B"/>
      <stop offset="1" stop-color="#4C7217"/>
    </linearGradient>
    <linearGradient id="sdfo_male_paint2" x1="45.3913" y1="13.7216" x2="39.4705" y2="13.3365" gradientUnits="userSpaceOnUse">
      <stop stop-color="#AFC62B"/>
      <stop offset="1" stop-color="#4C7217"/>
    </linearGradient>
    <linearGradient id="sdfo_male_paint3" x1="23.8933" y1="13.7216" x2="17.9724" y2="13.3365" gradientUnits="userSpaceOnUse">
      <stop stop-color="#AFC62B"/>
      <stop offset="1" stop-color="#4C7217"/>
    </linearGradient>
  </defs>
</svg>
