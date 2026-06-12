<script lang="ts">
  interface TwitterIconProps {
    width?: number | string;
    height?: number | string;
    fill?: string;
  }

  let { width = 20, height = 18, fill = 'white' }: TwitterIconProps = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" {width} {height} viewBox="0 0 20 18" fill="none">
  <path
    d="M15.575 0L10.579 5.711L6.259 0H0L7.477 9.776L0.391 17.875H3.425L8.894 11.625L13.674 17.875H19.776L11.982 7.571L18.607 0H15.575ZM14.511 16.06L3.542 1.719H5.345L16.191 16.059L14.511 16.06Z"
    {fill}
  />
</svg>
