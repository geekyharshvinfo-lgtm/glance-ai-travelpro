<script lang="ts">
  interface Props {
    width?: string | number;
    height?: string | number;
    stroke?: string;
    fill?: string;
    class?: string;
  }

  let {
    width = 16,
    height = 16,
    stroke = 'white',
    fill = 'white',
    class: className = '',
  }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  {width}
  {height}
  viewBox="0 0 16 16"
  fill="none"
  class={className}
>
  <g clip-path="url(#clip0_selfie_icon)">
    <path
      d="M5.58203 10.5577C6.13776 10.9696 6.81363 11.2112 7.54255 11.2112C8.27146 11.2112 8.94732 10.9696 9.50306 10.5577"
      {stroke}
      stroke-linecap="round"
    />
    <path
      d="M9.50311 7.9433C9.86403 7.9433 10.1566 7.50443 10.1566 6.96305C10.1566 6.42166 9.86403 5.98279 9.50311 5.98279C9.14219 5.98279 8.84961 6.42166 8.84961 6.96305C8.84961 7.50443 9.14219 7.9433 9.50311 7.9433Z"
      {fill}
    />
    <path
      d="M5.58319 7.9433C5.94411 7.9433 6.2367 7.50443 6.2367 6.96305C6.2367 6.42166 5.94411 5.98279 5.58319 5.98279C5.22227 5.98279 4.92969 6.42166 4.92969 6.96305C4.92969 7.50443 5.22227 7.9433 5.58319 7.9433Z"
      {fill}
    />
    <path
      d="M14.0776 9.25061C14.0776 11.7151 14.0776 12.9474 13.312 13.713C12.5464 14.4786 11.3141 14.4786 8.84961 14.4786"
      {stroke}
      stroke-linecap="round"
    />
    <path
      d="M6.23585 14.4786C3.77133 14.4786 2.53907 14.4786 1.77344 13.713C1.00781 12.9474 1.00781 11.7151 1.00781 9.25061"
      {stroke}
      stroke-linecap="round"
    />
    <path
      d="M6.23585 1.40881C3.77133 1.40881 2.53907 1.40881 1.77344 2.17444C1.00781 2.94007 1.00781 4.17233 1.00781 6.63685"
      {stroke}
      stroke-linecap="round"
    />
    <path
      d="M8.84961 1.40881C11.3141 1.40881 12.5464 1.40881 13.312 2.17444C14.0776 2.94007 14.0776 4.17233 14.0776 6.63685"
      {stroke}
      stroke-linecap="round"
    />
  </g>
  <defs>
    <clipPath id="clip0_selfie_icon">
      <rect width="15.8886" height="15.8886" fill="white" />
    </clipPath>
  </defs>
</svg>
