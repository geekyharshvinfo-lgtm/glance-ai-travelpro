import type { Brand, AskButton, SocialMedia } from './common';

// Product types
export interface HeroProduct {
  id: string;
  name: string;
  price: string;
  image: string;
  ai_look?: string | null;
  brand: Brand | null;
  redirectUrl: string;
}

export interface TimelessProduct {
  id: string;
  name: string;
  price: string;
  brand: Brand | null;
  image: string;
  ai_look?: string | null;
  redirectUrl: string;
}

export interface FunkProduct {
  id: string;
  name: string;
  price: string;
  image: string;
  ai_look?: string | null;
  brand: Brand;
  redirectUrl: string;
}

// Section types
export interface ShopTheProducts {
  label: string;
  products: HeroProduct[];
}

export interface TryOnButton {
  text: string;
  icon: string;
}

export type sectionType =
  | 'hero'
  | 'editorial'
  | 'ai_actions'
  | 'look_collection'
  | 'product_grid'
  | 'look_grid';

// Base section interface with common fields
export interface BaseSection {
  id: string;
  type: sectionType;
  contentType?: string;
  priority: number;
}

export interface ItemAction {
  type: string;
  text: string;
  icon?: string;
  url?: string;
  enabled?: boolean;
}

export interface HeroItem {
  id: string;
  collectionImage: string;
  description?: string;
  prompt?: string;
  actions?: ItemAction[];
  products: HeroProduct[];
  ai_look?: string | null;
}

export interface HeroSection extends BaseSection {
  type: 'hero';
  items: HeroItem[];
}

export interface LatestItem {
  id: string;
  collectionImage: string;
  ai_look?: string | null;
  title: string;
  description?: string;
  brand: Brand;
  price: string;
  date: string;
  prompt?: string;
  actions?: ItemAction[];
  products: TimelessProduct[];
}

export interface EditorialSection extends BaseSection {
  type: 'editorial';
  title: string;
  subtitle: string;
  items: LatestItem[];
}

// Legacy alias for backward compatibility
export type LatestSection = EditorialSection;

export interface SuggestionPills {
  text: string;
  icon?: string;
}

export interface AiActionsSection extends BaseSection {
  type: 'ai_actions';
  stillNotSureText: string;
  askButton: AskButton;
  suggestions: SuggestionPills[];
  inputPlaceholder: string;
}

// Legacy alias for backward compatibility
export type AiAssistantSection = AiActionsSection;

export interface TimelessCollection {
  id: string;
  collectionImage: string;
  title: string;
  matchPercentage?: number;
  products: TimelessProduct[];
  prompt?: string;
}

export interface LookCollection {
  id: string;
  collectionImage: string;
  title: string;
  description?: string;
  products: TimelessProduct[];
  prompt?: string;
  matchPercentage?: number;
  actions?: ItemAction[];
  ai_look?: string | null;
}

export interface LookCollectionSection extends BaseSection {
  type: 'look_collection';
  title: string;
  subtitle: string;
  items: LookCollection[];
}

export interface WardrobeItem {
  id: string;
  collectionImage: string;
  title: string;
  price: string;
  redirectUrl: string;
  brand?: Brand | null;
  actions?: ItemAction[];
  ai_look?: string | null;
  products: TimelessProduct[];
}

export interface ProductGridSection extends BaseSection {
  type: 'product_grid';
  title: string;
  subtitle: string;
  backgroundImage: string;
  viewAll?: boolean;
  items: WardrobeItem[];
}

// Legacy alias for backward compatibility
export type WardrobeSection = ProductGridSection;

export interface FunkLook {
  id: string;
  collectionImage: string;
  title: string;
  description?: string;
  products: FunkProduct[];
  prompt?: string;
  actions?: ItemAction[];
  image: string;
  ai_look: string;
}

export interface LookGridItem {
  id: string;
  collectionImage: string;
  prompt?: string;
  date?: string;
  products: TimelessProduct[];
  actions?: ItemAction[];
  ai_look?: string | null;
}

export interface LookGridSection extends BaseSection {
  type: 'look_grid';
  title: string;
  subtitle: string;
  description?: string;
  backgroundImage?: string;
  viewAll?: boolean;
  items: LookGridItem[];
}

// Legacy alias for backward compatibility (uses 'looks' field name)
export interface FunkCollectionSection extends BaseSection {
  type: 'look_collection' | 'look_grid';
  title: string;
  subtitle: string;
  looks: FunkLook[];
}

// Discriminated union of all section types
export type Section =
  | HeroSection
  | EditorialSection
  | AiActionsSection
  | LookCollectionSection
  | ProductGridSection
  | LookGridSection;

// Main Influencer type
export interface StarterTile {
  id: string;
  icon: string;
  iconKey: string;
  title: string;
  subtitle: string;
  gradient: { from: string; to: string };
  action: string;
}

export interface Influencer {
  id: string;
  slug: string;
  name: string;
  displayName: string[];
  gender: string;
  profileImage: string;
  avatarImage: string;
  heroImage: string;
  socialMedia: SocialMedia;
  bio: string;
  starterTiles: StarterTile[];
  searchPlaceholders: string[];
}

// Full API response data
export interface InfluencerData {
  influencer: Influencer;
  sections: Section[];
}

export interface InfluencerResponse {
  influencers: Record<string, InfluencerData>;
  metadata: {
    lastUpdated: string;
    totalProducts: number;
    aiPoweredBy: {
      text: string;
      logo: string;
    };
  };
  footerData: {
    googlePlayLink: string;
    appStoreLink: string;
    privacyPolicyLink: string;
    termsOfServiceLink: string;
    copyrightText: string;
    instagramLink: string;
    linkedInLink: string;
    twitterLink: string;
    oneLinkUrl: string;
    youtubeLink: string;
  };
}
