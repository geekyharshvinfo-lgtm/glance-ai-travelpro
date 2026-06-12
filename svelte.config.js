import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    runes: true,
  },
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),

    alias: {
      $lib: './src/lib',
      $components: './src/lib/components',
      $data: './src/lib/data',
    },

    inlineStyleThreshold: 5000,

    // Required by @sentry/sveltekit for server-side tracing and instrumentation
    experimental: {
      tracing: { server: true },
      instrumentation: { server: true },
    },
  },
};

export default config;
