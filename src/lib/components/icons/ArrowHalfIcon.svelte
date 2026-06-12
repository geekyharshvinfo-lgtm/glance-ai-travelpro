<script lang="ts">
  interface Props {
    width?: string | number;
    height?: string | number;
    stroke?: string;
    strokeWidth?: string | number;
    class?: string;
  }

  let { 
    width = 18, 
    height = 18, 
    stroke = 'white', 
    strokeWidth = 2,
    class: className = '' 
  }: Props = $props();
</script>

<svg
  {width}
  {height}
  viewBox="0 0 24 24"
  fill="none"
  class={className}
>
  <path
    d="M9 18l6-6-6-6"
    {stroke}
    stroke-width={strokeWidth}
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
