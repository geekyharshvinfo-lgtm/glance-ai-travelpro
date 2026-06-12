<script lang="ts">
  interface Props {
    width?: string | number;
    height?: string | number;
    stroke?: string;
    strokeWidth?: string | number;
    class?: string;
  }

  let { width = 16, height = 16, stroke = 'white', strokeWidth = 1.33333, class: className = '' }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  {width}
  {height}
  viewBox="0 0 16 16"
  fill="none"
  class={className}
>
  <path d="M12.0039 4.00098L4.00391 12.001" stroke={stroke} stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M4.00391 4.00098L12.0039 12.001" stroke={stroke} stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round"/>
</svg>
