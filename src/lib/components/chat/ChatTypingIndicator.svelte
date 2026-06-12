<script lang="ts">
</script>

<div class="typing-container">
  <div class="typing-bubble">
    <div class="dots">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  </div>
</div>

<style>
  .typing-container {
    display: flex;
    padding: 0.5rem 1.5rem;
    width: 100%;
  }

  .typing-bubble {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-radius: 0.75rem 0.75rem 0.75rem 0.25rem;
    padding: 0.75rem 1rem;
  }

  .dots {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;
  }

  .dot:nth-child(1) {
    background: #a5b4fc;
    animation-delay: -0.32s;
  }

  .dot:nth-child(2) {
    background: #c084fc;
    animation-delay: -0.16s;
  }

  .dot:nth-child(3) {
    background: #e879f9;
  }

  @keyframes bounce {
    0%,
    80%,
    100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
