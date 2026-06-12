<script lang="ts">
  interface ToggleIconProps {
    isOn?: boolean;
    onToggle?: (isOn: boolean) => void;
    width?: number;
    height?: number;
  }

  let { isOn = false, onToggle, width = 32, height = 18 }: ToggleIconProps = $props();

  function handleClick() {
    onToggle?.(!isOn);
  }
</script>

<button 
  class="toggle-button" 
  onclick={handleClick}
  aria-label={isOn ? 'Toggle on' : 'Toggle off'}
  type="button"
>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    {width} 
    {height} 
    viewBox="0 0 32 18" 
    fill="none"
    class="toggle-svg"
  >
    <!-- Toggle track background -->
    <rect 
      width="32" 
      height="18" 
      rx="9" 
      fill={isOn ? 'white' : 'grey'}
      class="toggle-track"
    />
    
    <!-- Toggle circle (knob) -->
    <circle 
      cx={isOn ? '23' : '9'} 
      cy="9" 
      r="7"
      fill="#111"
      class="toggle-circle"
    />
  </svg>
</button>

<style>
  .toggle-button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: opacity 0.2s;
  }

  .toggle-button:hover {
    opacity: 0.8;
  }

  .toggle-button:active {
    opacity: 0.6;
  }

  .toggle-svg {
    display: block;
  }

  .toggle-track {
    transition: fill 0.3s ease;
  }

  .toggle-circle {
    transition: cx 0.3s ease;
  }
</style>
