import { API_ENDPOINTS } from '$lib/config/env';

export interface BodyTypeConfig {
  id: string;
  iconUrl: string;
  thumbnailUrl: string;
  displayName: string;
}

// Body types organized by gender
export const BODY_TYPES_CONFIG = {
  male: [
    {
      id: 'LEAN',
      displayName: 'Slim',
      iconUrl: `${API_ENDPOINTS.STAGING_CDN}/public/content/assets/other/bodytype_images/m_lean_fb.webp`,
      thumbnailUrl: `${API_ENDPOINTS.STAGING_CDN}/public/content/assets/other/bodytype_images/m_lean.webp`,
    },
    {
      id: 'MID',
      displayName: 'Athletic',
      iconUrl: `${API_ENDPOINTS.STAGING_CDN}/public/content/assets/other/bodytype_images/m_mid_fb.webp`,
      thumbnailUrl: `${API_ENDPOINTS.STAGING_CDN}/public/content/assets/other/bodytype_images/m_mid.webp`,
    },
    {
      id: 'MID_PLUS',
      displayName: 'Average',
      iconUrl: `${API_ENDPOINTS.STAGING_CDN}/public/content/assets/other/bodytype_images/m_mid_plus_fb.webp`,
      thumbnailUrl: `${API_ENDPOINTS.STAGING_CDN}/public/content/assets/other/bodytype_images/m_mid_plus.webp`,
    },
    {
      id: 'MUSCULAR',
      displayName: 'Muscular',
      iconUrl: `${API_ENDPOINTS.STAGING_CDN}/public/content/assets/other/bodytype_images/m_muscular_fb.webp`,
      thumbnailUrl: `${API_ENDPOINTS.STAGING_CDN}/public/content/assets/other/bodytype_images/m_muscular.webp`,
    },
    {
      id: 'PLUS',
      displayName: 'Heavy',
      iconUrl: `${API_ENDPOINTS.STAGING_CDN}/public/content/assets/other/bodytype_images/m_plus_fb.webp`,
      thumbnailUrl: `${API_ENDPOINTS.STAGING_CDN}/public/content/assets/other/bodytype_images/m_plus.webp`,
    },
  ],
  female: [
    {
      id: 'PETITE',
      displayName: 'Petite',
      iconUrl: `${API_ENDPOINTS.STAGING_CDN}/public/content/assets/other/bodyTypes/female/w_petite_fb.webp`,
      thumbnailUrl: `${API_ENDPOINTS.STAGING_CDN}/public/content/assets/other/bodyTypes/female/w_petite.webp`,
    },
    {
      id: 'LEAN',
      displayName: 'Slim',
      iconUrl: `${API_ENDPOINTS.STAGING_CDN}/public/content/assets/other/bodyTypes/female/w_lean_fb.webp`,
      thumbnailUrl: `${API_ENDPOINTS.STAGING_CDN}/public/content/assets/other/bodyTypes/female/w_lean.webp`,
    },
    {
      id: 'MID',
      displayName: 'Athletic',
      iconUrl: `${API_ENDPOINTS.STAGING_CDN}/public/content/assets/other/bodyTypes/female/w_mid_fb.webp`,
      thumbnailUrl: `${API_ENDPOINTS.STAGING_CDN}/public/content/assets/other/bodyTypes/female/w_mid.webp`,
    },
    {
      id: 'CURVY',
      displayName: 'Curvy',
      iconUrl: `${API_ENDPOINTS.STAGING_CDN}/public/content/assets/other/bodyTypes/female/w_curvy_fb.webp`,
      thumbnailUrl: `${API_ENDPOINTS.STAGING_CDN}/public/content/assets/other/bodyTypes/female/w_curvy.webp`,
    },
    {
      id: 'PLUS',
      displayName: 'Plus Size',
      iconUrl: `${API_ENDPOINTS.STAGING_CDN}/public/content/assets/other/bodyTypes/female/w_plus_fb.webp`,
      thumbnailUrl: `${API_ENDPOINTS.STAGING_CDN}/public/content/assets/other/bodyTypes/female/w_plus.webp`,
    },
  ],
};
