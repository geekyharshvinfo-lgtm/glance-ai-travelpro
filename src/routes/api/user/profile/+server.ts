import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as Sentry from '@sentry/sveltekit';
import { GOOGLE_CLIENT_ID, API_ENDPOINTS } from '$lib/config/env';

const GLANCE_ACCOUNT_API_URL = `${API_ENDPOINTS.GLANCE_ACCOUNT}/api/v0/user`;

// GET user profile
export const GET: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json(
        {
          success: false,
          error: 'Missing or invalid authorization header',
        },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);

    const response = await fetch(GLANCE_ACCOUNT_API_URL, {
      method: 'GET',
      headers: {
        Authorization: accessToken,
        'X-Client-Id': GOOGLE_CLIENT_ID,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      if (response.status === 400) {
        errorMessage = 'Access token header cannot be blank';
      } else if (response.status === 401) {
        if (errorData.error === 'invalid_client') {
          errorMessage = 'Client id cannot be null or empty';
        } else {
          errorMessage = 'Invalid/expired token';
        }
      }

      return json(
        {
          success: false,
          error: errorMessage,
        },
        { status: response.status }
      );
    }

    const profileData = await response.json();

    return json({
      success: true,
      data: {
        profileId: profileData.id,
        email: profileData.email,
        name: profileData.name,
        profileImage: profileData.picture,
        age: profileData.age,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    Sentry.captureException(error, { tags: { operation: 'server_get_profile' } });
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
};

// PATCH user profile (update age)
export const PATCH: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json(
        {
          success: false,
          error: 'Missing or invalid authorization header',
        },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    const { age, accountId } = await request.json();

    if (typeof age !== 'number' || age < 1 || age > 150) {
      return json(
        {
          success: false,
          error: 'Invalid age value',
        },
        { status: 400 }
      );
    }

    const requestBody: { age: number; accountId?: string } = { age };
    if (accountId) {
      requestBody.accountId = accountId;
    }

    const response = await fetch(GLANCE_ACCOUNT_API_URL, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: accessToken,
        'X-Client-Id': GOOGLE_CLIENT_ID,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      if (response.status === 400) {
        errorMessage = 'Access token header cannot be blank';
      } else if (response.status === 401) {
        if (errorData.error === 'invalid_client') {
          errorMessage = 'Client id cannot be null or empty';
        } else {
          errorMessage = 'Invalid/expired token';
        }
      }

      return json(
        {
          success: false,
          error: errorMessage,
        },
        { status: response.status }
      );
    }

    // 204 No Content indicates successful update
    return json({
      success: true,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    Sentry.captureException(error, { tags: { operation: 'server_update_profile' } });
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
};
