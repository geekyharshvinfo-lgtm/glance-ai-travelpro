import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  // When Google redirects back with an authorization code, let the page
  // handle the exchange client-side (skip the default 302 to the influencer).
  const code = url.searchParams.get('code');
  if (code) {
    return { authCode: code };
  }

  const error = url.searchParams.get('error');
  if (error) {
    return { authError: error };
  }

  // Default: redirect to the default influencer profile
  throw redirect(302, '/shaq');
};
