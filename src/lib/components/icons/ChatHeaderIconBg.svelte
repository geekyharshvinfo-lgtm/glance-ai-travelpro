<script lang="ts">
  interface Props {
    width?: string | number;
    height?: string | number;
    class?: string;
  }

  let {
    width = 36,
    height = 36,
    class: className = '',
  }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  {width}
  {height}
  viewBox="0 0 36 36"
  fill="none"
  class={className}
>
  <circle cx="18" cy="18" r="18" fill="#525252" fill-opacity="0.5" />
  <circle cx="18" cy="18" r="17.5" stroke="url(#chat_icon_bg_grad0)" stroke-opacity="0.6" />
  <circle cx="18" cy="18" r="17.5" stroke="url(#chat_icon_bg_grad1)" stroke-opacity="0.6" />
  <defs>
    <linearGradient id="chat_icon_bg_grad0" x1="2.06369" y1="7.39286" x2="7.38072" y2="11.6301" gradientUnits="userSpaceOnUse">
      <stop stop-color="white" />
      <stop offset="1" stop-color="white" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="chat_icon_bg_grad1" x1="28.8344" y1="2.57143" x2="41.7181" y2="4.68534" gradientUnits="userSpaceOnUse">
      <stop stop-color="white" stop-opacity="0" />
      <stop offset="1" stop-color="white" />
    </linearGradient>
  </defs>
</svg>
