/**
 * Mock chat data for local development
 * Only TEXT and SUGGESTIONS payload types
 */
import {
  MESSAGE_TYPE,
  MESSAGE_SENDER,
  MESSAGE_STATUS,
  type MessageI,
  type SuggestionsPayload,
  type ProductItem,
} from '$lib/types';
import { generateMessageId, createUserTextMessage } from '$lib/utils/chat';

// Helper to create timestamps
const now = Date.now();
const msgTime = (offsetMs: number) => now - offsetMs;

// Text message helper
function createTextMessage(id: string, body: string, offsetMs: number): MessageI {
  return {
    id,
    createdAt: msgTime(offsetMs),
    updatedAt: msgTime(offsetMs),
    sender: MESSAGE_SENDER.ASSISTANT,
    type: MESSAGE_TYPE.TEXT,
    status: MESSAGE_STATUS.COMPLETE,
    content: { body },
  };
}

// Suggestions message helper (uses payload.suggestions format)
function createSuggestionsMessage(id: string, suggestions: string[], offsetMs: number): MessageI {
  return {
    id,
    createdAt: msgTime(offsetMs),
    updatedAt: msgTime(offsetMs),
    sender: MESSAGE_SENDER.ASSISTANT,
    type: MESSAGE_TYPE.TEXT, // Type is TEXT, but payload has suggestions
    status: MESSAGE_STATUS.COMPLETE,
    content: {
      body: null,
      payload: { suggestions } as SuggestionsPayload,
    },
  };
}

// Products message helper
function createProductsMessage(id: string, products: ProductItem[], offsetMs: number): MessageI {
  return {
    id,
    createdAt: msgTime(offsetMs),
    updatedAt: msgTime(offsetMs),
    sender: MESSAGE_SENDER.ASSISTANT,
    type: MESSAGE_TYPE.PRODUCTS,
    status: MESSAGE_STATUS.COMPLETE,
    content: {
      body: null,
      payload: products,
    },
  };
}

// Pre-built messages for mock responses
const welcomeTextMessage = createTextMessage(
  'msg-welcome-text',
  "Hi there! I'm your AI stylist. I'll help you curate outfits that you can also try on.",
  50100
);

const welcomeSuggestionsMessage = createSuggestionsMessage(
  'msg-welcome-suggestions',
  [
    "What's trending in Mumbai?",
    'Show me everyday outfits',
    "What's new in fashion?",
    'Help me find a specific style',
  ],
  50000
);

const trendingTextMessage = createTextMessage(
  'msg-trending-text',
  "Mumbai's fashion scene is buzzing! Here are the top trends right now:",
  40100
);

const trendingSuggestionsMessage = createSuggestionsMessage(
  'msg-trending-suggestions',
  ['Indo-western fusion', 'Minimalist chic', 'Bold prints', 'Sustainable fashion'],
  40000
);

const outfitsTextMessage = createTextMessage(
  'msg-outfits-text',
  "I'd love to help you find everyday outfits! What's the occasion?",
  30100
);

const outfitsSuggestionsMessage = createSuggestionsMessage(
  'msg-outfits-suggestions',
  ['Work from home', 'Office casual', 'Weekend brunch', 'Evening out'],
  30000
);

// Billie's wardrobe product recommendations
const billieWardrobeProducts: ProductItem[] = [
  {
    id: 'billie-product-1',
    ppid: 'BP001',
    imageUrl:
      'https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/6058d5694c3d4ccb8b726de5888e24a2.jpg',
    brand: 'Trendyol',
    price: '₹1819',
    message: 'Trendyol',
    cta: {
      text: 'Buy Now',
      url: 'https://www.myntra.com/Trousers/Trendyol/Trendyol-Women-Solid-Pleated-Trousers/21427062/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}',
    },
  },
  {
    id: 'billie-product-3',
    ppid: 'BP003',
    imageUrl:
      'https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/f073eef20fd24e4e8fdbcdd6bc0af3f6.jpg',
    brand: 'Blissclub',
    price: '₹1249',
    message: 'Blissclub',
    cta: {
      text: 'Buy Now',
      url: 'https://www.myntra.com/Trousers/Blissclub/Blissclub-Women-Flared-High-Rise-Trousers/30000040/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}',
    },
  },
  {
    id: 'billie-product-4',
    ppid: 'BP004',
    imageUrl:
      'https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/b093401cd1e94173b16ee687bb72e9e3.jpg',
    brand: 'CURVY STREET',
    price: '₹1189',
    message: 'CURVY STREET',
    cta: {
      text: 'Buy Now',
      url: 'https://www.myntra.com/Sweaters/CURVY+STREET/CURVY-STREET-Women-Plus-Size-Printed-Pullover/32157875/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}',
    },
  },
];

const billieWardrobeTextMessage = createTextMessage(
  'msg-billie-wardrobe-text',
  'Hey! This is Billie. I think these are the best looks from my wardrobe',
  20100
);

const billieWardrobeProductsMessage = createProductsMessage(
  'msg-billie-wardrobe-products',
  billieWardrobeProducts,
  20000
);

const styleTextMessage = createTextMessage(
  'msg-style-text',
  'Great choice! Let me understand your style preferences better.',
  20100
);

const styleSuggestionsMessage = createSuggestionsMessage(
  'msg-style-suggestions',
  ['Casual & comfortable', 'Formal & elegant', 'Sporty & active', 'Bohemian & free'],
  20000
);

// Mock responses keyed by user selection
const mockResponses: Record<string, MessageI[]> = {
  // Starter tile responses
  STYLE_ME: [welcomeTextMessage, welcomeSuggestionsMessage],
  CREATE_LOOK: [welcomeTextMessage, welcomeSuggestionsMessage],
  'Show me suggestions from your wardrobe': [
    billieWardrobeTextMessage,
    billieWardrobeProductsMessage,
  ],

  // Welcome suggestions responses
  "What's trending in Mumbai?": [trendingTextMessage, trendingSuggestionsMessage],
  'Show me everyday outfits': [outfitsTextMessage, outfitsSuggestionsMessage],
  "What's new in fashion?": [trendingTextMessage, trendingSuggestionsMessage],
  'Help me find a specific style': [styleTextMessage, styleSuggestionsMessage],

  // Trending suggestions responses
  'Indo-western fusion': [styleTextMessage, styleSuggestionsMessage],
  'Minimalist chic': [styleTextMessage, styleSuggestionsMessage],
  'Bold prints': [styleTextMessage, styleSuggestionsMessage],
  'Sustainable fashion': [styleTextMessage, styleSuggestionsMessage],

  // Outfits suggestions responses
  'Work from home': [styleTextMessage, styleSuggestionsMessage],
  'Office casual': [styleTextMessage, styleSuggestionsMessage],
  'Weekend brunch': [styleTextMessage, styleSuggestionsMessage],
  'Evening out': [styleTextMessage, styleSuggestionsMessage],

  // Style suggestions responses
  'Casual & comfortable': [
    createTextMessage(
      'msg-casual',
      "Perfect! I'll find you comfortable yet stylish options.",
      10100
    ),
    createSuggestionsMessage(
      'msg-casual-next',
      ['Show me looks', 'Change preferences', 'Start over'],
      10000
    ),
  ],
  'Formal & elegant': [
    createTextMessage(
      'msg-formal',
      'Elegant choice! Let me curate some sophisticated looks.',
      10100
    ),
    createSuggestionsMessage(
      'msg-formal-next',
      ['Show me looks', 'Change preferences', 'Start over'],
      10000
    ),
  ],
  'Sporty & active': [
    createTextMessage(
      'msg-sporty',
      "Active lifestyle! I'll find you functional yet trendy pieces.",
      10100
    ),
    createSuggestionsMessage(
      'msg-sporty-next',
      ['Show me looks', 'Change preferences', 'Start over'],
      10000
    ),
  ],
  'Bohemian & free': [
    createTextMessage(
      'msg-boho',
      'Love the boho vibe! Let me find some free-spirited looks.',
      10100
    ),
    createSuggestionsMessage(
      'msg-boho-next',
      ['Show me looks', 'Change preferences', 'Start over'],
      10000
    ),
  ],
};

/**
 * Get mock AI response for a user selection
 */
export function getMockResponse(selection: string): MessageI[] | null {
  const responses = mockResponses[selection];
  if (!responses) return null;

  const now = Date.now();
  return responses.map((msg, index) => ({
    ...msg,
    id: generateMessageId(),
    createdAt: now + index,
    updatedAt: now + index,
  }));
}

/**
 * Create a user selection message
 */
export function createUserSelectionMessage(selection: string): MessageI {
  return createUserTextMessage(selection);
}

/**
 * Create default AI response for free text input
 * Returns TEXT message followed by SUGGESTIONS payload
 */
export function createDefaultAiResponse(userText: string): MessageI[] {
  const now = Date.now();
  return [
    {
      id: generateMessageId(),
      createdAt: now,
      updatedAt: now,
      sender: MESSAGE_SENDER.ASSISTANT,
      type: MESSAGE_TYPE.TEXT,
      status: MESSAGE_STATUS.COMPLETE,
      content: {
        body: `I understand you're interested in "${userText}". Let me help you explore some options!`,
      },
    },
    {
      id: generateMessageId(),
      createdAt: now + 1,
      updatedAt: now + 1,
      sender: MESSAGE_SENDER.ASSISTANT,
      type: MESSAGE_TYPE.TEXT,
      status: MESSAGE_STATUS.COMPLETE,
      content: {
        body: null,
        payload: {
          suggestions: ['Show me outfits', 'Style recommendations', 'Start over'],
        } as SuggestionsPayload,
      },
    },
  ];
}
