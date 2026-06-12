<script lang="ts">
  interface BackButtonProps {
    width?: number | string;
    height?: number | string;
    stroke?: string;
    strokeWidth?: number | string;
  }

  let { width = 24, height = 24, stroke = 'white', strokeWidth = 2 }: BackButtonProps = $props();
</script>

<svg {width} {height} viewBox="0 0 24 24" fill="none">
  <path
    d="M15 18L9 12L15 6"
    {stroke}
    stroke-width={strokeWidth}
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
