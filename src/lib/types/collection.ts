import type { HeroSection } from './influencer';

// Product suggestion API types
export interface ProductPrice {
  currency: string;
  discount: string;
  price: string;
  discountPrice: string;
}

export interface SuggestedProduct {
  id: string;
  name: string;
  brand: string;
  sku: string;
  price: ProductPrice;
  imageUrl: string;
  alternateImageUrls: string[];
  deeplinkUrl: string;
  gender: string;
}

export interface ProductSuggestionRequest {
  productId: string;
  country: string;
  gender: string;
  maxResults: number;
}

// Collection page types
export interface SelectedForYouProduct {
  id: string;
  ai_look?: string | null;
  lookImage: string;
  productImage: string;
  name: string;
  price: string;
  productRedirectUrl: string;
}

export interface SelectedForYouSection {
  title: string;
  subtitle: string;
  products: SelectedForYouProduct[];
}

export interface CollectionSections {
  hero: HeroSection;
  selectedForYou: SelectedForYouSection;
}

export interface CollectionData {
  influencerSlug: string;
  sections: CollectionSections;
}
