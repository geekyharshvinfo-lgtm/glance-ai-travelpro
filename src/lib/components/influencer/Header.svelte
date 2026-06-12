<script lang="ts">
</script>

<header class="header">
  <img
    src="https://x-stg.glance-cdn.com/public/content/assets/other/Glance%20Logo.png"
    alt="Glance"
    class="header-logo"
  />
  <div class="header-right">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="#333" stroke-width="2" />
      <path d="M16 16l4 4" stroke="#333" stroke-width="2" />
    </svg>
  </div>
</header>

<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 0.0625rem solid #f0f0f0;
    position: sticky;
    top: 0;
    background: white;
    z-index: 100;
  }

  .header-logo {
    height: 1.5rem;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
</style>
