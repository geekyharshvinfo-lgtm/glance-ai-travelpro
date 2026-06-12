<script lang="ts">
  interface Props {
    width?: string | number;
    height?: string | number;
    stroke?: string;
    class?: string;
  }

  let { width = 14, height = 14, stroke = 'white', class: className = '' }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  {width}
  {height}
  viewBox="0 0 14 14"
  fill="none"
  class={className}
>
  <g clip-path="url(#clip0_legal_privacy_icon)">
    <path
      d="M7.80587 12.1703C7.94176 12.2495 8.0097 12.2891 8.10557 12.3097C8.18002 12.3257 8.28853 12.3257 8.36298 12.3097C8.45885 12.2891 8.52679 12.2495 8.66267 12.1703C9.85827 11.4727 13.1443 9.28165 13.1443 6.26911V2.95486C13.1443 2.61243 13.1443 2.44121 13.0784 2.31072C13.02 2.19503 12.9287 2.10268 12.8137 2.04288C12.684 1.97543 12.5099 1.97338 12.1616 1.96926C10.3377 1.94769 9.28601 1.79709 8.23427 0.745361C7.18254 1.79709 6.1308 1.94769 4.30697 1.96926C3.95868 1.97338 3.78453 1.97543 3.65482 2.04288C3.53983 2.10268 3.44856 2.19503 3.39013 2.31072C3.32422 2.44121 3.32422 2.61243 3.32422 2.95486V6.26911C3.32422 9.28165 6.61025 11.4727 7.80587 12.1703Z"
      {stroke}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>
  <defs>
    <clipPath id="clip0_legal_privacy_icon">
      <rect width="13.9913" height="13.9912" fill="white" />
    </clipPath>
  </defs>
</svg>
