/**
 * Collection navigation utilities using sessionStorage as fallback
 */

import type { HeroProduct } from '$lib/types';
import { browser } from '$app/environment';

interface CollectionNavData {
  productId: string;
  heroImage: string;
  generatedLook: string;
  heroProducts: HeroProduct[];
  timestamp: number;
}

const STORAGE_KEY = 'collection-nav-data';
const EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

export function setCollectionNavData(
  productId: string,
  heroImage: string,
  heroProducts: HeroProduct[] = [],
  generatedLook: string = ''
) {
  if (!browser) return;

  const data: CollectionNavData = {
    productId,
    heroImage,
    heroProducts,
    generatedLook,
    timestamp: Date.now(),
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to store collection nav data:', error);
  }
}

export function getCollectionNavData(): CollectionNavData | null {
  if (!browser) return null;

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data: CollectionNavData = JSON.parse(stored);

    // Check if data is expired
    if (Date.now() - data.timestamp > EXPIRY_TIME) {
      clearCollectionNavData();
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Failed to retrieve collection nav data:', error);
    clearCollectionNavData();
    return null;
  }
}

export function clearCollectionNavData() {
  if (!browser) return;

  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear collection nav data:', error);
  }
}
