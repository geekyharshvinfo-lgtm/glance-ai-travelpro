<script lang="ts">
  interface Props {
    width?: string | number;
    height?: string | number;
    stroke?: string;
    strokeWidth?: string | number;
    class?: string;
  }

  let {
    width = 24,
    height = 24,
    stroke = 'white',
    strokeWidth = 2,
    class: className = '',
  }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  {width}
  {height}
  viewBox="0 0 24 24"
  fill="none"
  class={className}
>
  <path d="M12 5V19" stroke={stroke} stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" />
  <path d="M5 12H19" stroke={stroke} stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" />
</svg>
