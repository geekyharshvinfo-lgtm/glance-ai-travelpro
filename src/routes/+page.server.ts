import type { PageServerLoad } from './$types';

// Root page shows TravelPro selfie capture screen — no redirect
export const load: PageServerLoad = async () => {
  return {};
};
