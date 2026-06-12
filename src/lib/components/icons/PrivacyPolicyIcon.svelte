<script lang="ts">
  interface Props {
    width?: number;
    height?: number;
    class?: string;
  }

  let { width = 13, height = 15, class: className = '' }: Props = $props();
</script>

<svg 
  xmlns="http://www.w3.org/2000/svg" 
  {width} 
  {height} 
  viewBox="0 0 13 15" 
  fill="none"
  class={className}
>
  <path 
    d="M12.136 6.83364V3.8335L8.86338 0.5H1.22725C1.03437 0.5 0.849393 0.570241 0.713007 0.695272C0.576621 0.820302 0.5 0.98988 0.5 1.1667V13.1673C0.5 13.3441 0.576621 13.5137 0.713007 13.6387C0.849393 13.7637 1.03437 13.834 1.22725 13.834H5.59075" 
    stroke="#E6E6E6" 
    stroke-linecap="round" 
    stroke-linejoin="round"
  />
  <path 
    d="M8.50103 0.5V3.8335H12.1373M7.41016 9.56711C7.41016 9.21143 9.95553 8.50039 9.95553 8.50039C9.95553 8.50039 12.5009 9.21143 12.5009 9.56711C12.5009 12.4116 9.95553 13.834 9.95553 13.834C9.95553 13.834 7.41016 12.4116 7.41016 9.56711Z" 
    stroke="#E6E6E6" 
    stroke-linecap="round" 
    stroke-linejoin="round"
  />
</svg>
