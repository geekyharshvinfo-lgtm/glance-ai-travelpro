<script lang="ts">
  interface Props {
    width?: number | string;
    height?: number | string;
    class?: string;
  }

  let { width = 25, height = 25, class: className = '' }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  {width}
  {height}
  viewBox="0 0 25 25"
  fill="none"
  class={className}
>
  <g filter="url(#filter0_d_3672_22931)">
    <path
      d="M9.92188 4.50781C9.59746 4.99467 9.67196 5.56434 9.83105 6.00488C9.99234 6.45149 10.2689 6.85099 10.4893 7.07812C10.9294 7.53171 11.5294 7.79591 12.1611 7.81445C12.3825 7.82092 12.6021 7.79722 12.8135 7.74512C13.1195 7.66971 13.3738 7.59806 13.6006 7.46094C13.8347 7.31935 14.0131 7.12477 14.2109 6.85352C14.3786 6.62351 14.5362 6.22957 14.6338 5.85938C14.6841 5.66865 14.7221 5.46836 14.7373 5.28223C14.7518 5.10402 14.7487 4.90417 14.6885 4.73145L14.6377 4.58691L14.5586 4.35938C15.4763 4.41958 16.3447 4.81059 16.999 5.46484C17.7122 6.17804 18.1132 7.14569 18.1133 8.1543V9.54004C18.1132 9.6304 18.0766 9.71735 18.0127 9.78125C17.9487 9.84505 17.8618 9.88086 17.7715 9.88086H16.0352V15.0791C16.0352 15.3533 15.9263 15.6167 15.7324 15.8105C15.5386 16.0042 15.2759 16.1133 15.002 16.1133H9.46191C9.18799 16.1132 8.9252 16.0042 8.73145 15.8105C8.53759 15.6167 8.42871 15.3533 8.42871 15.0791V9.88086H6.69238C6.60198 9.88084 6.51514 9.84513 6.45117 9.78125C6.38727 9.71735 6.35167 9.6304 6.35156 9.54004V8.1543C6.35168 7.14569 6.75164 6.17804 7.46484 5.46484C8.14737 4.78232 9.06296 4.38644 10.0244 4.35352L9.92188 4.50781Z"
      stroke="white"
      stroke-width="0.702381"
      shape-rendering="crispEdges"
    />
  </g>
  <path
    d="M4.08594 10.881C4.08594 10.6706 4.2565 10.5 4.46689 10.5H19.705C19.9154 10.5 20.0859 10.6706 20.0859 10.881V18H4.08594V10.881Z"
    fill="url(#paint0_linear_3672_22931)"
  />
  <g filter="url(#filter1_d_3672_22931)">
    <rect x="4.08594" y="10.5" width="16" height="0.761905" rx="0.380952" fill="white" />
  </g>
  <defs>
    <filter
      id="filter0_d_3672_22931"
      x="0"
      y="0"
      width="24.4648"
      height="24.4644"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB"
    >
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feColorMatrix
        in="SourceAlpha"
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        result="hardAlpha"
      />
      <feOffset dy="2" />
      <feGaussianBlur stdDeviation="3" />
      <feComposite in2="hardAlpha" operator="out" />
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.45 0" />
      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3672_22931" />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="effect1_dropShadow_3672_22931"
        result="shape"
      />
    </filter>
    <filter
      id="filter1_d_3672_22931"
      x="3.70499"
      y="10.119"
      width="16.7619"
      height="1.52362"
      filterUnits="userSpaceOnUse"
      color-interpolation-filters="sRGB"
    >
      <feFlood flood-opacity="0" result="BackgroundImageFix" />
      <feColorMatrix
        in="SourceAlpha"
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        result="hardAlpha"
      />
      <feOffset />
      <feGaussianBlur stdDeviation="0.190476" />
      <feComposite in2="hardAlpha" operator="out" />
      <feColorMatrix
        type="matrix"
        values="0 0 0 0 0.74902 0 0 0 0 0.709804 0 0 0 0 1 0 0 0 0.5 0"
      />
      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3672_22931" />
      <feBlend
        mode="normal"
        in="SourceGraphic"
        in2="effect1_dropShadow_3672_22931"
        result="shape"
      />
    </filter>
    <linearGradient
      id="paint0_linear_3672_22931"
      x1="12.0859"
      y1="10.5"
      x2="12.0859"
      y2="18"
      gradientUnits="userSpaceOnUse"
    >
      <stop stop-color="#CECECE" />
      <stop offset="1" stop-color="white" stop-opacity="0" />
    </linearGradient>
  </defs>
</svg>
