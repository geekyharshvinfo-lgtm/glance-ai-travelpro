import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as Sentry from '@sentry/sveltekit';
import { GOOGLE_CLIENT_ID, API_ENDPOINTS } from '$lib/config/env';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// Backend API endpoints
const GLANCE_ACCOUNT_API_URL = `${API_ENDPOINTS.GLANCE_ACCOUNT}/api/v0/login/google`;

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { code, redirect_uri } = await request.json();

    if (!code || !redirect_uri) {
      return json(
        {
          success: false,
          error: 'Missing required parameters',
        },
        { status: 400 }
      );
    }

    // Exchange authorization code for tokens with Google
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Google token exchange failed:', error);
      Sentry.captureMessage('Google token exchange failed', {
        level: 'error',
        tags: { operation: 'google_token_exchange' },
      });
      return json(
        {
          success: false,
          error: 'Failed to exchange authorization code',
        },
        { status: 401 }
      );
    }

    const googleTokens = await tokenResponse.json();

    // Call Glance backend to authenticate with Google tokens
    const glanceResponse = await fetch(
      `${GLANCE_ACCOUNT_API_URL}?${new URLSearchParams({
        code: googleTokens.access_token, // Pass Google access token as code
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri,
        grant_type: 'authorization_code',
      })}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!glanceResponse.ok) {
      const error = await glanceResponse.text();
      console.error('Glance authentication failed:', error);
      Sentry.captureMessage(`Glance authentication failed: ${glanceResponse.status}`, {
        level: 'error',
        tags: { operation: 'glance_auth' },
      });
      return json(
        {
          success: false,
          error: 'Authentication failed',
        },
        { status: glanceResponse.status }
      );
    }

    const authData = await glanceResponse.json();

    // Get user profile from Google
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${googleTokens.access_token}`,
      },
    });

    let userProfile = null;
    if (profileResponse.ok) {
      const googleProfile = await profileResponse.json();
      userProfile = {
        profileId: authData.profileId || googleProfile.id,
        email: googleProfile.email,
        name: googleProfile.name,
        profileImage: googleProfile.picture,
      };
    }

    return json({
      success: true,
      data: {
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        accessTokenExpiry: authData.accessTokenExpiry || Date.now() + 3600000,
        refreshTokenExpiry: authData.refreshTokenExpiry || Date.now() + 2592000000,
        user: userProfile,
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    Sentry.captureException(error, { tags: { operation: 'server_google_auth' } });
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
};
