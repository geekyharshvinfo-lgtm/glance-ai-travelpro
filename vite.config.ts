import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDeployEnv = env.PUBLIC_ENV === 'production' || env.PUBLIC_ENV === 'uat';
  return {
    plugins: [
      sentrySvelteKit({
        autoUploadSourceMaps: !!(process.env.SENTRY_AUTH_TOKEN && isDeployEnv),
        sourceMapsUploadOptions: {
          org: 'glance-app',
          project: 'ai-influencer',
          authToken: env.SENTRY_AUTH_TOKEN,
          release: {
            name: 'ai-influencer@' + process.env.npm_package_version,
          },
        },
      }),
      sveltekit(),
    ],
    server: {
      port: 3000,
    },
    build: {
      target: 'esnext',
      cssCodeSplit: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        },
        format: {
          comments: false,
        },
      },
      rollupOptions: {
        treeshake: 'smallest',
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              const parts = id.split('node_modules/')[1].split('/');
              // For scoped packages (@scope/pkg), use both segments
              const pkg = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
              // Skip packages that produce empty chunks after tree-shaking
              if (pkg === 'esm-env' || pkg === 'firebase') return;
              return pkg;
            }
          },
        },
      },
    },
  };
});
