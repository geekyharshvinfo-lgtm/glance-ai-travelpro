<script lang="ts">
  import { StarLoader } from '../loaders';

  interface Props {
    elapsedTime: string;
  }
  let { elapsedTime }: Props = $props();
</script>

<div class="processing-content">
  <div class="timer-container">
    <StarLoader size={32} speed={1.2} />
    <div class="timer">{elapsedTime}</div>
  </div>
  <p class="generating-text">Generating Your Look</p>
</div>

<style>
  .processing-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-align: center;
    color: white;
    z-index: 10;
  }

  .timer {
    color: #fff;
    font-family: 'Inter';
    font-size: 16px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    padding-right: 20px;
  }

  .timer-container {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .generating-text {
    color: #fff;
    text-align: center;
    font-size: 12px;
    font-style: normal;
    font-weight: 600;
    line-height: 19.2px;
  }
</style>
