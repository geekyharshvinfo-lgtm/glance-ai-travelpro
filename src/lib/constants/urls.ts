/**
 * Application URLs and external links
 */

export const EXTERNAL_LINKS = {
  PRIVACY_POLICY: 'https://glance.com/ai-looks-privacy-policy',
  TERMS_OF_SERVICE: 'https://glance.com/terms',
  COOKIE_POLICY: 'https://glance.com/cookie-policy',
} as const;

export const EMAIL_LINKS = {
  FEEDBACK: 'AIprivacy@glance.com',
} as const;

// CDN Asset URLs - should be moved to environment variables in production
export const CDN_ASSETS = {
  // Icons
  STYLE_ME_WHITE_ICON:
    'https://x-stg.glance-cdn.com/public/content/assets/other/style-me-white-icon.svg',
  ASK_INFLUENCER: 'https://x-stg.glance-cdn.com/public/content/assets/other/AskInfluencer.webp',
  GLANCE_LOGO: 'https://x-stg.glance-cdn.com/public/content/assets/other/Glance%20Logo.png',
  APP_STORE_ICON: 'https://x-stg.glance-cdn.com/public/content/assets/other/app-store-icon.png',
  GOOGLE_PLAY_ICON: 'https://x-stg.glance-cdn.com/public/content/assets/other/google-play-icon.png',
  INFLUENCER_PROFILE_ICON:
    'https://x-stg.glance-cdn.com/public/content/assets/other/influencer-profile-icon.svg',

  // Social Icons
  INSTA_ICON: 'https://x-stg.glance-cdn.com/public/content/assets/other/influencer-insta-icon.svg',
  LINKEDIN_ICON:
    'https://x-stg.glance-cdn.com/public/content/assets/other/influencer-linkedin-icon.svg',
  TWITTER_ICON:
    'https://x-stg.glance-cdn.com/public/content/assets/other/influencer-twitter-icon.svg',

  // Images
  BILLIE_TIMELESS_COLLECTION:
    'https://x-stg.glance-cdn.com/public/content/assets/other/billie-ellish-timeless-collection.png',
  BILLIE_HERO: 'https://x-stg.glance-cdn.com/public/content/assets/other/billie-hero.webp',
  INFLUENCER_COLLECTION_LOOK:
    'https://x-stg.glance-cdn.com/public/content/assets/other/influencer-collection-look.png',
  BE_TIMELESS_ITEM_1:
    'https://x-stg.glance-cdn.com/public/content/assets/other/be-timeless-item-1.png',

  // External Image URLs (for testing/demo)
  UNSPLASH_DEMO_IMAGE:
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=200&fit=crop',
} as const;
