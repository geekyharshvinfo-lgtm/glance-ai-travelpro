import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getInfluencerBySlug, ApiError } from '$lib/api';
import { USE_MOCK_INFLUENCER_DATA, getMockInfluencerData } from '$lib/data/mocks/influencer';
import * as Sentry from '@sentry/sveltekit';
import fs from 'fs';
import path from 'path';
import { env } from '$env/dynamic/private';

// Load override from Upstash Redis (prod) or local file (dev fallback)
async function loadOverride(): Promise<Record<string, unknown>> {
  // Upstash Redis — used in production (Vercel)
  const upstashUrl = env.UPSTASH_REDIS_REST_URL;
  const upstashToken = env.UPSTASH_REDIS_REST_TOKEN;
  if (upstashUrl && upstashToken) {
    try {
      const res = await fetch(`${upstashUrl}/get/feed-override`, {
        headers: { Authorization: `Bearer ${upstashToken}` },
        cache: 'no-store',
      });
      const json = await res.json();
      // Upstash returns the value as stored; we store double-encoded JSON strings
      if (json.result) {
        const once = JSON.parse(json.result);   // outer string → inner string
        return typeof once === 'string' ? JSON.parse(once) : once;
      }
    } catch (e) {
      console.warn('[override] Upstash read failed, falling back to local file:', e);
    }
  }

  // Local file fallback (dev / no Upstash configured)
  try {
    const overridePath = path.join(process.env.HOME || '~', 'Downloads', 'feed-override.json');
    if (!fs.existsSync(overridePath)) return {};
    return JSON.parse(fs.readFileSync(overridePath, 'utf-8'));
  } catch {
    return {};
  }
}

// Deep-merge override on top of base (only present keys override)
function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    const bv = base[key];
    const ov = override[key];
    if (ov && typeof ov === 'object' && !Array.isArray(ov) && bv && typeof bv === 'object' && !Array.isArray(bv)) {
      result[key] = deepMerge(bv as Record<string, unknown>, ov as Record<string, unknown>);
    } else {
      result[key] = ov;
    }
  }
  return result;
}

export const load: LayoutServerLoad = async ({ params, cookies }) => {
  const profileId = cookies.get('ai_influencer_profile_id');
  const accountId = cookies.get('ai_influencer_account_id');
  const deviceId = cookies.get('ai_influencer_device_id');

  const override = await loadOverride();
  const overrideInf = (override.influencer || {}) as Record<string, unknown>;
  const overrideSections = (override.sections || null) as unknown[] | null;
  const overrideFooter = (override.footerData || {}) as Record<string, unknown>;

  // Use mock data if flag is enabled
  if (USE_MOCK_INFLUENCER_DATA) {
    const data = getMockInfluencerData(params.slug);
    return {
      influencer: deepMerge(data.influencers[params.slug].influencer as unknown as Record<string, unknown>, overrideInf),
      sections: overrideSections || data.influencers[params.slug].sections,
      metadata: data.metadata,
      footerData: deepMerge(data.footerData as unknown as Record<string, unknown>, overrideFooter),
    };
  }

  try {
    // Use global fetch (not SvelteKit's fetch) to avoid forwarding the
    // incoming request's Origin header, which the backend rejects via CORS.
    const data = await getInfluencerBySlug(params.slug, undefined, {
      ...(profileId ? { profileId } : {}),
      ...(accountId ? { accountId } : {}),
      ...(deviceId ? { deviceId } : {}),
    });

    return {
      influencer: deepMerge(data.influencers[params.slug].influencer as unknown as Record<string, unknown>, overrideInf),
      sections: overrideSections || data.influencers[params.slug].sections,
      metadata: data.metadata,
      footerData: deepMerge(data.footerData as unknown as Record<string, unknown>, overrideFooter),
    };
  } catch (err) {
    console.error('Failed to fetch influencer data from API:', err);
    Sentry.getCurrentScope().setTag('slug', params.slug);

    // If override data is present, serve entirely from override (allows custom slugs like /shaq)
    if (Object.keys(overrideInf).length > 0) {
      console.log('API failed — serving from feed-override.json for slug:', params.slug);
      return {
        influencer: overrideInf as Record<string, unknown>,
        sections: overrideSections || [],
        metadata: {},
        footerData: overrideFooter as Record<string, unknown>,
      };
    }

    if (err instanceof ApiError) {
      throw error(err.status, err.message);
    }

    throw error(500, 'Failed to load influencer data');
  }
};
