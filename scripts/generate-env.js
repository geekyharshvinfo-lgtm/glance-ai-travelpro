#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFileMap = {
  development: '.env',
  uat: '.uat.env',
  production: '.prod.env',
};

const cliArg = process.argv[2];
const envFile = envFileMap[cliArg] || '.env';

// Load environment variables from the appropriate file
const envPath = path.join(__dirname, '..', envFile);
if (!fs.existsSync(envPath)) {
  console.error(`Environment file not found: ${envPath}`);
  process.exit(1);
}

const envConfig = dotenv.config({ path: envPath });
if (envConfig.error) {
  console.error(`Error loading environment file: ${envConfig.error}`);
  process.exit(1);
}

// Generate the runtime config file
const configContent = `// This file is auto-generated. Do not edit manually.
// Generated at: ${new Date().toISOString()}

export const env = {
  // Firebase
  PUBLIC_FIREBASE_API_KEY: '${process.env.PUBLIC_FIREBASE_API_KEY || ''}',
  PUBLIC_FIREBASE_AUTH_DOMAIN: '${process.env.PUBLIC_FIREBASE_AUTH_DOMAIN || ''}',
  PUBLIC_FIREBASE_PROJECT_ID: '${process.env.PUBLIC_FIREBASE_PROJECT_ID || ''}',
  PUBLIC_FIREBASE_STORAGE_BUCKET: '${process.env.PUBLIC_FIREBASE_STORAGE_BUCKET || ''}',
  PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '${process.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''}',
  PUBLIC_FIREBASE_APP_ID: '${process.env.PUBLIC_FIREBASE_APP_ID || ''}',
  PUBLIC_FIREBASE_MEASUREMENT_ID: '${process.env.PUBLIC_FIREBASE_MEASUREMENT_ID || ''}',
  // Google OAuth
  PUBLIC_GOOGLE_CLIENT_ID: '${process.env.PUBLIC_GOOGLE_CLIENT_ID || ''}',
  // Auth
  PUBLIC_AUTH_CLIENT_ID: '${process.env.PUBLIC_AUTH_CLIENT_ID || ''}',
  // API Endpoints
  PUBLIC_GLANCE_ACCOUNT_API_URL: '${process.env.PUBLIC_GLANCE_ACCOUNT_API_URL || ''}',
  PUBLIC_BIFROST_API_URL: '${process.env.PUBLIC_BIFROST_API_URL || ''}',
  PUBLIC_AI_INFLUENCER_BACKEND_URL: '${process.env.PUBLIC_AI_INFLUENCER_BACKEND_URL || ''}',
  PUBLIC_STAGING_CDN: '${process.env.PUBLIC_STAGING_CDN || ''}',
  PUBLIC_IMAGE_CDN: '${process.env.PUBLIC_IMAGE_CDN || ''}',
  // CDN Image Resizer
  PUBLIC_CDN_RESIZER_BASE: '${process.env.PUBLIC_CDN_RESIZER_BASE || ''}',
  // Sentinel
  PUBLIC_SENTINEL_ENDPOINT: '${process.env.PUBLIC_SENTINEL_ENDPOINT || ''}',
  PUBLIC_SENTINEL_API_KEY: '${process.env.PUBLIC_SENTINEL_API_KEY || ''}',
  // Sentry
  PUBLIC_SENTRY_DSN: '${process.env.PUBLIC_SENTRY_DSN || ''}',
  PUBLIC_SENTRY_ENVIRONMENT: '${process.env.PUBLIC_SENTRY_ENVIRONMENT || 'development'}',
  // Chat Session Restore Time (in seconds)
  PUBLIC_CHAT_SESSION_RESTORE_TIME: '${process.env.PUBLIC_CHAT_SESSION_RESTORE_TIME || '86400'}'
};
`;

// Write the config file
const outputPath = path.join(__dirname, '..', 'src', 'lib', 'config', 'runtime-env.ts');
const outputDir = path.dirname(outputPath);

// Create directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, configContent);
console.log(`✅ Environment config generated at: ${outputPath}`);
