<script lang="ts">
  interface StarLoaderProps {
    size?: number; // Size in pixels (default: 48)
    speed?: number; // Animation speed multiplier (default: 1)
  }

  let { size = 48, speed = 1 }: StarLoaderProps = $props();

  // Calculate animation duration based on speed
  // 16 frames × 0.04s = 0.64s base duration
  const animationDuration = $derived(0.64 / speed);
</script>

<div
  class="star-loader"
  style="width: {size}px; height: {size}px; animation-duration: {animationDuration}s;"
></div>

<style>
  .star-loader {
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    animation: starFrames infinite linear;
  }

  @keyframes starFrames {
    0% {
      background-image: url('/images/star-loader-animation/frame_00_delay-0.04s.gif');
    }
    6.25% {
      background-image: url('/images/star-loader-animation/frame_01_delay-0.04s.gif');
    }
    12.5% {
      background-image: url('/images/star-loader-animation/frame_02_delay-0.04s.gif');
    }
    18.75% {
      background-image: url('/images/star-loader-animation/frame_03_delay-0.04s.gif');
    }
    25% {
      background-image: url('/images/star-loader-animation/frame_04_delay-0.04s.gif');
    }
    31.25% {
      background-image: url('/images/star-loader-animation/frame_05_delay-0.04s.gif');
    }
    37.5% {
      background-image: url('/images/star-loader-animation/frame_06_delay-0.04s.gif');
    }
    43.75% {
      background-image: url('/images/star-loader-animation/frame_07_delay-0.04s.gif');
    }
    50% {
      background-image: url('/images/star-loader-animation/frame_08_delay-0.04s.gif');
    }
    56.25% {
      background-image: url('/images/star-loader-animation/frame_09_delay-0.04s.gif');
    }
    62.5% {
      background-image: url('/images/star-loader-animation/frame_10_delay-0.04s.gif');
    }
    68.75% {
      background-image: url('/images/star-loader-animation/frame_11_delay-0.04s.gif');
    }
    75% {
      background-image: url('/images/star-loader-animation/frame_12_delay-0.04s.gif');
    }
    81.25% {
      background-image: url('/images/star-loader-animation/frame_13_delay-0.04s.gif');
    }
    87.5% {
      background-image: url('/images/star-loader-animation/frame_14_delay-0.04s.gif');
    }
    93.75% {
      background-image: url('/images/star-loader-animation/frame_15_delay-0.04s.gif');
    }
    100% {
      background-image: url('/images/star-loader-animation/frame_00_delay-0.04s.gif');
    }
  }
</style>
