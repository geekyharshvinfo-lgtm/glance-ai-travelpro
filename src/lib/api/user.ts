/**
 * User API service for onboarding and profile management
 */

import { browser } from '$app/environment';
import { userStore } from '$lib/stores/user.svelte';
import { api } from './client';

// Match the embed project's types
export const GENDER = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
} as const;

export type Gender = keyof typeof GENDER;

export const BODY_TYPE = {
  // Male body types
  LEAN: 'LEAN',
  MID: 'MID',
  MID_PLUS: 'MID_PLUS',
  MUSCULAR: 'MUSCULAR',
  STOCKY: 'STOCKY',
  MUSCULAR_STOCKY: 'MUSCULAR_STOCKY',
  PLUS: 'PLUS',
  SUPER_PLUS: 'SUPER_PLUS',

  // Female body types
  PETITE: 'PETITE',
  CURVY: 'CURVY',
  CURVY_FULL: 'CURVY_FULL',
  FULL: 'FULL',
  PLUS_SIZE: 'PLUS_SIZE',
  SLIM: 'SLIM',
} as const;

export type BodyType = keyof typeof BODY_TYPE;

export const ETHNICITY = {
  CAUCASIAN: 'CAUCASIAN',
  MIDDLE_EASTERN: 'MIDDLE_EASTERN',
  ASIAN: 'ASIAN',
  AFRICAN: 'AFRICAN',
  HISPANIC: 'HISPANIC',
} as const;

export type Ethnicity = keyof typeof ETHNICITY;

export const LOGIN_TYPES = {
  DEVICE: 'DEVICE',
  INSTAGRAM: 'INSTAGRAM',
  GOOGLE: 'GOOGLE'
}

export type LoginType = keyof typeof LOGIN_TYPES;

export interface UserOnboardingRequest {
  imagePath: string;
  gender: Gender;
  body: BodyType | string; // string for backward compatibility with UI
  ethnicity: string[]; // Array of ethnicity values
  path: string; // conversation path from chat
}

export interface UserOnboardingResponse {
  success: boolean;
  data?: {
    profileId: string;
    profileImage?: string;
    path: string;
    token: string;
  };
  error?: string;
  message?: string;
}

/**
 * Map UI values to API values
 */
function mapBodyTypeToAPI(gender: 'male' | 'female', uiBodyType: string): BodyType | null {
  const mappings: Record<string, Partial<Record<string, BodyType>>> = {
    male: {
      Slim: 'LEAN',
      Athletic: 'MID',
      Average: 'MID_PLUS',
      Muscular: 'MUSCULAR',
      Heavy: 'PLUS',
    },
    female: {
      Slim: 'SLIM',
      Petite: 'PETITE',
      Athletic: 'MID',
      Curvy: 'CURVY',
      'Plus Size': 'PLUS_SIZE',
    },
  };

  return mappings[gender]?.[uiBodyType] || null;
}

function mapEthnicityToAPI(uiEthnicity: string): Ethnicity | null {
  const mappings: Record<string, Ethnicity> = {
    Asian: 'ASIAN',
    'Black/African': 'AFRICAN',
    'Caucasian/White': 'CAUCASIAN',
    'Hispanic/Latino': 'HISPANIC',
    'Middle Eastern': 'MIDDLE_EASTERN',
  };

  return mappings[uiEthnicity] || null;
}

/**
 * Submit user onboarding data
 */
export async function submitOnboarding(data: {
  gender: 'male' | 'female';
  body: string;
  ethnicity: string[];
  imagePath: string;
  path?: string;
}): Promise<UserOnboardingResponse> {
  try {
    // Map UI values to API values
    const apiGender = data.gender === 'male' ? GENDER.MALE : GENDER.FEMALE;
    const apiBodyType = mapBodyTypeToAPI(data.gender, data.body);
    if (!apiBodyType) {
      throw new Error('Invalid body type');
    }

    // Map ethnicities
    const apiEthnicities = data.ethnicity
      .map((e) => mapEthnicityToAPI(e))
      .filter((e): e is Ethnicity => e !== null);

    const trimmedPath = data.path ? data.path.trim().replace(/\/messages$/, '') : '';

    const requestData: UserOnboardingRequest = {
      imagePath: data.imagePath,
      gender: apiGender,
      body: apiBodyType,
      ethnicity: apiEthnicities,
      path: trimmedPath,
    };

    const loginType =
      userStore.authType === 'google'
        ? LOGIN_TYPES.GOOGLE
        : userStore.authType === 'guest'
          ? LOGIN_TYPES.DEVICE
          : LOGIN_TYPES.DEVICE;

    // Use centralized api client - automatically handles token refresh and auth headers
    const result = await api.post<UserOnboardingResponse['data']>(
      '/customer/onboard',
      requestData,
      {
        headers: {
          'x-influencer-id': browser ? localStorage.getItem('influencer_id') || '' : '',
          'X-Login-Type': loginType,
        },
      }
    );

    // Update user store with onboarding data
    if (result?.profileId) {
      userStore.profileId = result.profileId;
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Onboarding error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit onboarding data',
    };
  }
}
