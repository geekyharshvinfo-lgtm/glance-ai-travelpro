// Store for managing the open/close state and data for the CollectionDrawer
import type { CollectionData, HeroProduct } from '$lib/types';
import type { ProductGridSection } from '$lib/types/influencer';

export type DrawerMode = 'collection' | 'productGrid';

interface CollectionDrawerState {
  isOpen: boolean;
  mode: DrawerMode;
  collection: CollectionData | null;
  collectionLoading: boolean;
  selectedProductId: string | null;
  selectedHeroImage: string | null;
  generatedHeroImage: string | null;
  selectedHeroProducts: HeroProduct[];
  // Product grid mode data
  gridData: ProductGridSection | null;
  // For fetching grid data
  sectionId: string | null;
  influencerSlug: string | null;
}

const initialState: CollectionDrawerState = {
  isOpen: false,
  mode: 'collection',
  collection: null,
  collectionLoading: false,
  selectedProductId: null,
  selectedHeroImage: null,
  generatedHeroImage: null,
  selectedHeroProducts: [],
  gridData: null,
  sectionId: null,
  influencerSlug: null,
};

export const collectionDrawerStore = $state<CollectionDrawerState>({ ...initialState });

export function openCollectionDrawer(params: Partial<CollectionDrawerState>) {
  collectionDrawerStore.isOpen = true;
  collectionDrawerStore.mode = params.mode || 'collection';
  collectionDrawerStore.collection = params.collection || null;
  collectionDrawerStore.collectionLoading = params.collectionLoading || false;
  collectionDrawerStore.selectedProductId = params.selectedProductId || null;
  collectionDrawerStore.selectedHeroImage = params.selectedHeroImage || null;
  collectionDrawerStore.generatedHeroImage = params.generatedHeroImage || null;
  collectionDrawerStore.selectedHeroProducts = params.selectedHeroProducts || [];
  collectionDrawerStore.gridData = params.gridData || null;
  collectionDrawerStore.sectionId = params.sectionId || null;
  collectionDrawerStore.influencerSlug = params.influencerSlug || null;
}

export function closeCollectionDrawer() {
  collectionDrawerStore.isOpen = false;
  // Reset to defaults
  collectionDrawerStore.mode = 'collection';
  collectionDrawerStore.gridData = null;
  collectionDrawerStore.sectionId = null;
  collectionDrawerStore.influencerSlug = null;
}
