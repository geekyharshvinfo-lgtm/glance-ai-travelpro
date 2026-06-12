<script lang="ts">
  import { WarningIcon } from '$lib/components/icons';

  interface Props {
    warningNumber: number;
    isMinor?: boolean; // For minor violations that end session immediately
    remainingTime?: number; // Remaining time in seconds before session restore
  }

  let { warningNumber, isMinor = false, remainingTime = 0 }: Props = $props();

  type Warning = {
    title: string;
    text: string;
    iconColor: string;
  };

  // Format remaining time into a human-readable string
  function formatRemainingTime(seconds: number): string {
    if (seconds <= 0) return '';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else if (minutes > 0) {
      return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
    } else {
      return `${secs}s`;
    }
  }

  const warningConfig: Record<number, Warning> = {
    1: {
      title: '',
      text: "I'm sorry, but I can't assist with that topic.",
      iconColor: '#FFA726',
    },
    2: {
      title: 'Heads up!',
      text: "You've tried accessing restricted content a few times. If this continues, your session may be restricted.",
      iconColor: '#EF5350',
    },
    3: {
      title: 'Session ended',
      text: 'Your chat has been disabled due to repeated policy violations. Access will be restored after 24 hours.',
      iconColor: '#EF5350',
    }
  };

  const minorWarningConfig: Warning = {
    title: 'Session ended',
    text: 'This service is restricted to users aged 18 years or older.',
    iconColor: '#EF5350',
  };

  const currentWarning = $derived(isMinor ? minorWarningConfig : (warningConfig[warningNumber] || warningConfig[1]));
  
  // For warning 3 or minor, append the remaining time to the text
  const warningText = $derived(() => {
    if ((warningNumber === 3 || isMinor) && remainingTime > 0) {
      const timeStr = formatRemainingTime(remainingTime);
      if (isMinor) {
        return `${currentWarning.text} Access will be restored in ${timeStr}.`;
      } else {
        // For warning 3, replace "after 24 hours" with the actual countdown
        return currentWarning.text.replace('after 24 hours.', `in ${timeStr}.`);
      }
    }
    return currentWarning.text;
  });
</script>

<div 
  class="warning-message"
  class:warning-first={warningNumber === 1}
  class:warning-second={warningNumber === 2}
  class:warning-final={warningNumber === 3 || isMinor}
>
  <div class="warning-icon">
    <WarningIcon stroke={currentWarning.iconColor}/>
  </div>
  <div class="warning-content">
    {#if currentWarning.title}
      <div class="warning-title">{currentWarning.title}</div>
    {/if}
    <div class="warning-text">{warningText()}</div>
  </div>
</div>

<style>
  .warning-message {
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 12px 12px 12px 4px;
    border: 1px solid rgba(162, 76, 0, 0.50);
    background: #1B1B1B;
  }

  .warning-icon {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    padding-top: 0.125rem;
  }

  .warning-content {
    flex: 1;
  }

  .warning-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 0.25rem;
  }

  .warning-text {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.4;
  }
</style>
