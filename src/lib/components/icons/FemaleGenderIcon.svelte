<script lang="ts">
  interface Props {
    width?: string | number;
    height?: string | number;
    class?: string;
  }

  let { width = 28, height = 28, class: className = '' }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  {width}
  {height}
  viewBox="0 0 28 28"
  fill="none"
  class={className}
>
  <circle cx="14" cy="10.6504" r="6" stroke="white" stroke-width="1.09091" />
  <path
    d="M13.998 16.833L13.998 23.4148"
    stroke="white"
    stroke-width="1.09091"
    stroke-linecap="round"
  />
  <path
    d="M16.2031 20.1238L11.8031 20.1238"
    stroke="white"
    stroke-width="1.09091"
    stroke-linecap="round"
  />
</svg>
