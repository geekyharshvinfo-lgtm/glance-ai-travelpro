<script lang="ts">
  interface Props {
    width?: string | number;
    height?: string | number;
    stroke?: string;
    strokeOpacity?: string | number;
    strokeWidth?: string | number;
    class?: string;
  }

  let {
    width = 42,
    height = 42,
    stroke = 'white',
    strokeOpacity = 0.72,
    strokeWidth = 2,
    class: className = '',
  }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  {width}
  {height}
  viewBox="0 0 42 42"
  fill="none"
  class={className}
>
  <path
    d="M21 17.5C24.866 17.5 28 14.366 28 10.5C28 6.63401 24.866 3.5 21 3.5C17.134 3.5 14 6.63401 14 10.5C14 14.366 17.134 17.5 21 17.5Z"
    {stroke}
    stroke-opacity={strokeOpacity}
    stroke-width={strokeWidth}
  />
  <path
    d="M35 30.625C35 34.9737 35 38.5 21 38.5C7 38.5 7 34.9737 7 30.625C7 26.2763 13.2685 22.75 21 22.75C28.7315 22.75 35 26.2763 35 30.625Z"
    {stroke}
    stroke-opacity={strokeOpacity}
    stroke-width={strokeWidth}
  />
</svg>
