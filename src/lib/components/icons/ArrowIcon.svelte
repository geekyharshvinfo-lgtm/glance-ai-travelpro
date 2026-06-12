<script lang="ts">
  interface Props {
    width?: number | string;
    height?: number | string;
    fill?: string;
    class?: string;
  }

  let { width = 16, height = 8, fill = 'white', class: className = '' }: Props = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  {width}
  {height}
  viewBox="0 0 16 8"
  fill="none"
  class={className}
>
  <path
    d="M15.3496 4.03568C15.5449 3.84042 15.5449 3.52384 15.3496 3.32858L12.1677 0.146595C11.9724 -0.0486672 11.6558 -0.0486672 11.4606 0.146595C11.2653 0.341857 11.2653 0.65844 11.4606 0.853702L14.289 3.68213L11.4606 6.51056C11.2653 6.70582 11.2653 7.0224 11.4606 7.21766C11.6558 7.41293 11.9724 7.41293 12.1677 7.21766L15.3496 4.03568ZM0 3.68213V4.18213H14.9961V3.68213V3.18213H0V3.68213Z"
    {fill}
  />
</svg>
