<script lang="ts">
  interface Props {
    width?: string | number;
    height?: string | number;
    stroke?: string;
    class?: string;
  }

  let { width = 16, height = 16, stroke = 'white', class: className = '' }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  {width}
  {height}
  viewBox="0 0 16 16"
  fill="none"
  class={className}
>
  <path
    d="M5.33398 8H5.33998M7.99465 8H8.00065M10.6613 8H10.6673"
    {stroke}
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <path
    d="M8.00065 14.6667C11.6825 14.6667 14.6673 11.6819 14.6673 8.00004C14.6673 4.31814 11.6825 1.33337 8.00065 1.33337C4.31875 1.33337 1.33398 4.31814 1.33398 8.00004C1.33398 9.06651 1.5844 10.0744 2.02962 10.9684C2.14794 11.2059 2.18732 11.4774 2.11873 11.7338L1.72166 13.2178C1.54928 13.862 2.13866 14.4514 2.78288 14.279L4.26691 13.882C4.52327 13.8134 4.79479 13.8528 5.03234 13.971C5.92623 14.4163 6.93418 14.6667 8.00065 14.6667Z"
    {stroke}
  />
</svg>
