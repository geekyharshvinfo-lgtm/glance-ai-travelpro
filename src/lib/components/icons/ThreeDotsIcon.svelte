<script lang="ts">
  interface Props {
    width?: number;
    height?: number;
    class?: string;
  }
  let { width = 16, height = 16, class: className }: Props = $props();
</script>

<svg {width} {height} viewBox="0 0 16 16" fill="none" class={className}>
  <circle cx="8" cy="3" r="1.2" fill="rgba(255,255,255,0.5)" />
  <circle cx="8" cy="8" r="1.2" fill="rgba(255,255,255,0.5)" />
  <circle cx="8" cy="13" r="1.2" fill="rgba(255,255,255,0.5)" />
</svg>
