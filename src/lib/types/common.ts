// Brand information
export interface Brand {
  name: string;
  logo: string | null;
}

// Button types
export interface AskButton {
  text: string;
  icon: string;
}

export interface StyleMeButton {
  enabled: boolean;
  text: string;
  icon?: string;
}

export interface BuyButton {
  enabled: boolean;
  text: string;
  url: string;
}

// Social media
export interface InstagramInfo {
  handle: string;
  followersCount: string;
  verified: boolean;
}

export interface SocialMedia {
  instagram: InstagramInfo;
}

// Metadata
export interface AiPoweredBy {
  text: string;
  logo: string;
}

export interface Metadata {
  lastUpdated: string;
  totalProducts: number;
  aiPoweredBy: AiPoweredBy;
}
