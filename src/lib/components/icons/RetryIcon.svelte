<script lang="ts">
  interface Props {
    width?: string | number;
    height?: string | number;
    class?: string;
    stroke?: string;
  }

  let { width = 13, height = 13, class: className = '', stroke = 'white' }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  {width}
  {height}
  viewBox="0 0 13 13"
  class={className}
>
<path d="M11.9167 5.41667C11.9167 5.41667 10.8306 3.93695 9.94834 3.05405C9.06604 2.17115 7.8468 1.625 6.5 1.625C3.80761 1.625 1.625 3.80761 1.625 6.5C1.625 9.19239 3.80761 11.375 6.5 11.375C8.72251 11.375 10.5976 9.88774 11.1845 7.85417M11.9167 5.41667V2.16667M11.9167 5.41667H8.66667" stroke={stroke} stroke-width="0.975" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

