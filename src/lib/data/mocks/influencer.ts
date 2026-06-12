import type { InfluencerResponse } from '$lib/types';

/**
 * Toggle this flag to switch between mock data and API data
 * Set to `true` to use mock data, `false` to use real API
 */
export const USE_MOCK_INFLUENCER_DATA = false;

export const mockInfluencerData: InfluencerResponse = {
  "influencers": {
    "dinah-saurr": {
      "influencer": {
        "id": "inf_dinah_001",
        "slug": "dinah-saurr",
        "name": "Dinah",
        "displayName": [
          "DINAH",
          "SAURR"
        ],
        "starterTiles": [
          {
            "id": "starter-wardrobe",
            "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/starter-wardrobe.svg",
            "iconKey": "wardrobe",
            "title": "Suggestion from Dinah's wardrobe",
            "subtitle": "Best of Dinah",
            "gradient": {
              "from": "#020B1C",
              "to": "#0A214C"
            },
            "action": "Show me suggestions from your wardrobe"
          },
          {
            "id": "starter-occasion",
            "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/starter-occasion.svg",
            "iconKey": "dressForOccasion",
            "title": "Dress for Occasion",
            "subtitle": "Give us your occasion & we take care of rest",
            "gradient": {
              "from": "#032F30",
              "to": "#064C4E"
            },
            "action": "Help me dress for an occasion"
          },
          {
            "id": "starter-funk",
            "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/starter-funk.svg",
            "iconKey": "funkCollection",
            "title": "Funk by Dinah",
            "subtitle": "From Dinah's latest collection",
            "gradient": {
              "from": "#252A05",
              "to": "#41490B"
            },
            "action": "Show me Funk collection"
          },
          {
            "id": "starter-complete",
            "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/starter-complete.svg",
            "iconKey": "completeMyLook",
            "title": "Complete my look",
            "subtitle": "See what goes with your existing apparel",
            "gradient": {
              "from": "#042921",
              "to": "#054638"
            },
            "action": "Help me complete my look"
          }
        ],
        "gender": "female",
        "profileImage": "https://storage.googleapis.com/glance-ail-avatars-non-prod-cdn/avatar/meeeeeee/id4/conv-local-1/msg-local-111/6b9bd.jpg",
        "avatarImage": "https://storage.googleapis.com/glance-ail-avatars-non-prod-cdn/avatar/meeeeeee/id4/conv-local-1/msg-local-111/6b9bd.jpg",
        "heroImage": "https://storage.googleapis.com/glance-ail-avatars-non-prod-cdn/avatar/meeeeeee/id4/conv-local-1/msg-local-111/66d96.jpg",
        "socialMedia": {
          "instagram": {
            "handle": "@dinahsaurr",
            "followersCount": "250K",
            "verified": true
          }
        },
        "bio": "Fashion and lifestyle creator known for experimental styling, bold layering, and expressive creativity through fashion and dance"
      },
      "sections": [
        {
          "id": "inf_dinah_001_hero",
          "type": "hero",
          "contentType": "looks+products",
          "priority": 1,
          "items": [
            {
              "id": "inf_dinah_001_hero",
              "collectionImage": "https://storage.googleapis.com/glance-ail-avatars-non-prod-cdn/avatar/meeeeeee/id4/conv-local-1/msg-local-111/66d96.jpg",
              "description": "Featured influencer spotlight showcasing Dinah with her signature style, interactive engagement options, and curated product recommendations",
              "prompt": "Chic portrait of Dinah in a stylish top with classic trousers and stacked silver cuff bracelets, set against a moody gradient background with dramatic lighting.",
              "actions": [
                {
                  "type": "ask",
                  "text": "ASK DINAH",
                  "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/AskInfluencer.webp"
                }
              ],
              "products": [
                {
                  "id": "32914380-L",
                  "name": "Dream Beauty Fashion Top",
                  "price": "₹220",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/daf16218d52e42c6af96a6ed996e9653.jpg",
                  "brand": {
                    "name": "Dream Beauty Fashion",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Tops/Dream+Beauty+Fashion/Dream-Beauty-Fashion-Top/32914380/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "30848582-Onesize",
                  "name": "Jewels Galaxy Silver-Plated Cuff Bracelet",
                  "price": "₹349",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/b8959d83607b4bb8aacbf2d497031d2d.jpg",
                  "brand": {
                    "name": "Jewels Galaxy",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Bracelet/Jewels+Galaxy/Jewels-Galaxy-Silver-Plated-Cuff-Bracelet/30848582/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "27216278-Onesize",
                  "name": "JOKER & WITCH Silver-Plated Cuff Bracelet",
                  "price": "₹659",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/5b89f7bd713c4b08a1ac2f1bd8ac6708.jpg",
                  "brand": {
                    "name": "JOKER & WITCH",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Bracelet/JOKER+%26+WITCH/JOKER--WITCH-Silver-Plated-Cuff-Bracelet/27216278/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "32916518-M",
                  "name": "Dream Beauty Fashion Top",
                  "price": "₹None",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/86d4228c0f694942ae47ffbf0e3bd853.jpg",
                  "brand": {
                    "name": "Dream Beauty Fashion",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Tops/Dream+Beauty+Fashion/Dream-Beauty-Fashion-Top/32916518/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                }
              ]
            }
          ]
        },
        {
          "id": "dinah_saurr_latest_002",
          "type": "editorial",
          "contentType": "looks+products",
          "priority": 2,
          "title": "Latest",
          "subtitle": "By Dinah",
          "items": [
            {
              "id": "inf_dinah_001_latest_001",
              "collectionImage": "https://storage.googleapis.com/glance-ail-avatars-non-prod-cdn/avatar/meeeeeee/id4/conv-local-1/msg-local-111/a1550.jpg",
              "title": "Latest Collection",
              "description": "Curated look from Dinah's collection",
              "prompt": "Casual chic editorial featuring a crisp white T-shirt paired with bootcut jeans and a silver cuff bracelet, shot in a bright minimalist studio setting.",
              "brand": {
                "name": "",
                "logo": ""
              },
              "price": "",
              "date": "2024-01-15T10:00:00Z",
              "actions": [
                {
                  "type": "ask",
                  "text": "ASK DINAH",
                  "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/AskInfluencer.webp"
                }
              ],
              "products": [
                {
                  "id": "20322414-M",
                  "name": "Trendyol Women White T-shirt",
                  "price": "₹1149",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/5188b31841d04ad8906e0f8b28f26409.jpg",
                  "brand": {
                    "name": "Trendyol",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Tshirts/Trendyol/Trendyol-Women-White-T-shirt/20322414/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "23823194-L",
                  "name": "Calvin Klein Jeans Round Neck Twisted Crop Top",
                  "price": "₹2369",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/c4c807a59656476b8ee0950c46d00cde.jpg",
                  "brand": {
                    "name": "Calvin Klein Jeans",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Tops/Calvin+Klein+Jeans/Calvin-Klein-Jeans-Round-Neck-Twisted-Crop-Top/23823194/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "24760746-26",
                  "name": "Flying Machine Women Mid-Rise Bootcut Fit Clean Look Non Stretchable Jeans",
                  "price": "₹1451",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/61eae893ea304c32996d5b08583c2fe5.jpg",
                  "brand": {
                    "name": "Flying Machine",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Jeans/Flying+Machine/Flying-Machine-Women-Mid-Rise-Bootcut-Fit-Clean-Look-Non-Stretchable-Jeans/24760746/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "25621580-Onesize",
                  "name": "TEEJH Silver-Plated Cuff Bracelet",
                  "price": "₹395",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/e3e851d3d5bf42a8a8da6e8ed83ae100.jpg",
                  "brand": {
                    "name": "TEEJH",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Bracelet/TEEJH/TEEJH-Silver-Plated-Cuff-Bracelet/25621580/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "22549272-S",
                  "name": "Freehand by The Indian Garage Co Round Neck Crop Fitted Cotton Top",
                  "price": "₹405",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2f5b1dae737b4974b88eaab7139eb7c7.jpg",
                  "brand": {
                    "name": "Freehand by The Indian Garage Co",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Tops/Freehand+by+The+Indian+Garage+Co/Freehand-by-The-Indian-Garage-Co-Round-Neck-Crop-Fitted-Cotton-Top/22549272/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                }
              ]
            },
            {
              "id": "inf_dinah_001_latest_002",
              "collectionImage": "https://storage.googleapis.com/glance-ail-avatars-non-prod-cdn/avatar/meeeeeee/id4/conv-local-1/msg-local-111/d4882.jpg",
              "title": "Latest Look 1",
              "description": "Curated look from Dinah's collection",
              "prompt": "Sporty streetwear look featuring a typography printed sweatshirt with relaxed high-rise trousers, captured in an urban setting with warm natural lighting.",
              "brand": {
                "name": "",
                "logo": ""
              },
              "price": "",
              "date": "2024-01-15T10:00:00Z",
              "actions": [
                {
                  "type": "ask",
                  "text": "ASK DINAH",
                  "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/AskInfluencer.webp"
                }
              ],
              "products": [
                {
                  "id": "22875124-XL",
                  "name": "The Roadster Life Co. Typography Printed Seasonal Trends Sweatshirt",
                  "price": "₹569",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/71939e539c96466d9baefbf66c10e08e.jpg",
                  "brand": {
                    "name": "Roadster",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Sweatshirts/Roadster/The-Roadster-Life-Co-Typography-Printed-Seasonal-Trends-Sweatshirt-/22875124/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "26206550-XL",
                  "name": "Tokyo Talkies Black Typography Printed Relaxed Fit Pullover Sweatshirt",
                  "price": "₹577",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/8a88fea1f4ec47eebbf12b9d902813a3.jpg",
                  "brand": {
                    "name": "Tokyo Talkies",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Sweatshirts/Tokyo+Talkies/Tokyo-Talkies-Black-Typography-Printed-Relaxed-Fit-Pullover-Sweatshirt/26206550/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "32515482-28",
                  "name": "TOOCHKI Women Relaxed Straight Leg High-Rise Trousers",
                  "price": "₹498",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/a45fc77c86454615a61d10e6a4a6fa41.jpg",
                  "brand": {
                    "name": "TOOCHKI",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Trousers/TOOCHKI/TOOCHKI-Women-Relaxed-Straight-Leg-High-Rise-Trousers/32515482/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "32156167-L",
                  "name": "Kappa Women Typography Printed V-Neck Pullover Sweatshirt",
                  "price": "₹None",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/586cbc50047148b5bfd6d442920d17d7.jpg",
                  "brand": {
                    "name": "Kappa",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Sweatshirts/Kappa/Kappa-Women-Typography-Printed-V-Neck-Pullover-Sweatshirt/32156167/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "29634558-28",
                  "name": "Next One Women Smart Loose Fit High-Rise Easy Wash Trousers",
                  "price": "₹898",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/50914ff91155459b842ed228b0e9a333.jpg",
                  "brand": {
                    "name": "Next One",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Trousers/Next+One/Next-One-Women-Smart-Loose-Fit-High-Rise-Easy-Wash-Trousers/29634558/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "30099408-S",
                  "name": "DressBerry Sporty Touch Printed Cotton Terry Boxy Fit Crop Sweatshirt",
                  "price": "₹629",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/8009e2bf0d5b418daf69e67fa1c5cc4c.jpg",
                  "brand": {
                    "name": "DressBerry",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Sweatshirts/DressBerry/DressBerry-Sporty-Touch-Printed-Cotton-Terry-Boxy-Fit-Crop-Sweatshirt/30099408/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                }
              ]
            },
            {
              "id": "inf_dinah_001_latest_003",
              "collectionImage": "https://storage.googleapis.com/glance-ail-avatars-non-prod-cdn/avatar/meeeeeee/id4/conv-local-1/msg-local-111/12569.jpg",
              "title": "Latest Look 2",
              "description": "Curated look from Dinah's collection",
              "prompt": "Cozy winter fashion look showcasing a geometric knit sweater with bootcut trousers, set against a soft neutral background with warm studio lighting.",
              "brand": {
                "name": "",
                "logo": ""
              },
              "price": "",
              "date": "2024-01-15T10:00:00Z",
              "actions": [
                {
                  "type": "ask",
                  "text": "ASK DINAH",
                  "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/AskInfluencer.webp"
                }
              ],
              "products": [
                {
                  "id": "20238850-M",
                  "name": "Berrylush Women Grey Abstract Knits Bits Sweater",
                  "price": "₹1055",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/00c3fb9a11ec433491004e4e142ecaf1.jpg",
                  "brand": {
                    "name": "Berrylush",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Sweaters/Berrylush/Berrylush-Women-Grey-Abstract-Knits-Bits-Sweater/20238850/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "25881548-XL",
                  "name": "STYLE BLUSH Geometric Self Design Acrylic Pullover",
                  "price": "₹799",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/da48597c81a54f8b9c66f2ed66bfaf99.jpg",
                  "brand": {
                    "name": "STYLE BLUSH",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Sweaters/STYLE+BLUSH/STYLE-BLUSH-Geometric-Self-Design-Acrylic-Pullover/25881548/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "31080187-Onesize",
                  "name": "GFO Women Geometric Applique Woollen Sweater",
                  "price": "₹2939",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/660c0e474138449db876482d703811c5.jpg",
                  "brand": {
                    "name": "GFO",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Sweaters/GFO/GFO-Women-Geometric-Applique-Woollen-Sweater/31080187/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "23950842-26",
                  "name": "BAESD Women Geometric Printed Slim Fit Bootcut Trousers",
                  "price": "₹383",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/45699a6df6c94c118752e0cc03706380.jpg",
                  "brand": {
                    "name": "BAESD",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Trousers/BAESD/BAESD-Women-Geometric-Printed-Slim-Fit-Wrinkle-Free-Bootcut-Trousers/23950842/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "23071428-L",
                  "name": "The Roadster Life Co. Self Design Geometric High Neck Pullover Sweater",
                  "price": "₹863",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/1f69b0878222460f9a99ca8e3f76f48d.jpg",
                  "brand": {
                    "name": "Roadster",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Sweaters/Roadster/The-Roadster-Life-Co-Self-Design-Geometric-High-Neck-Pullover-Sweater-/23071428/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                }
              ]
            }
          ]
        },
        {
          "id": "dinah_saurr_aiAssistant_003",
          "type": "ai_actions",
          "contentType": "looks",
          "priority": 3,
          "stillNotSureText": "Still not sure?",
          "askButton": {
            "text": "ASK DINAH",
            "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/AskInfluencer.webp"
          },
          "suggestions": [
            {
              "text": "Suggest a look for me",
              "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/ai-influencer-suggest.svg"
            },
            {
              "text": "Mix & Match",
              "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/ai-influencer-mix-match.svg"
            },
            {
              "text": "For new year's",
              "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/ai-influencer-new-year.svg"
            },
            {
              "text": "Glam Moment",
              "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/ai-influencer-glam.svg"
            },
            {
              "text": "Concert Vibe",
              "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/ai-influencer-concert.svg"
            },
            {
              "text": "Accessories",
              "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/ai-influencer-accessories.svg"
            },
            {
              "text": "OOTD",
              "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/ai-influencer-star.svg"
            }
          ],
          "inputPlaceholder": "What are you looking for?"
        },
        {
          "id": "dinah_saurr_timelessClassic_004",
          "type": "look_collection",
          "contentType": "looks+products",
          "priority": 4,
          "title": "Timeless classic by Dinah",
          "subtitle": "Try what Dinah suggests as timeless look",
          "items": [
            {
              "id": "inf_dinah_001_timeless_001",
              "collectionImage": "https://storage.googleapis.com/glance-ail-avatars-non-prod-cdn/avatar/meeeeeee/id4/conv-local-1/msg-local-111/776c4.jpg",
              "title": "Timeless Classic Collection",
              "matchPercentage": 85,
              "prompt": "Elegant layered outfit featuring a woollen cardigan over a geometric print shirt with light-wash mom-fit jeans, styled with a refined minimalist aesthetic in a softly lit studio.",
              "products": [
                {
                  "id": "31612771-4XL",
                  "name": "Marks & Spencer Women Woollen Cardigan",
                  "price": "₹2999",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/1735b0061fba4ea48de5d26b05fd30bd.jpg",
                  "brand": {
                    "name": "Marks & Spencer",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Sweaters/Marks+%26+Spencer/Marks--Spencer-Women-Woollen-Cardigan/31612771/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "20197878-M",
                  "name": "Trendyol Charcoal Geometric Print Tie-Up Neck Shirt Style Top",
                  "price": "₹2399",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/653b901462f6437ebedf72843b5150e5.jpg",
                  "brand": {
                    "name": "Trendyol",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Tops/Trendyol/Trendyol-Charcoal-Geometric-Print-Tie-Up-Neck-Shirt-Style-Top/20197878/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "31023743-28",
                  "name": "zayla Women Comfort Mom Fit Mid-Rise Light Fade Stretchable Jeans",
                  "price": "₹540",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/c1ceca5cb07b466fbb87545b0297883f.jpg",
                  "brand": {
                    "name": "zayla",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Jeans/zayla/zayla-Women-Comfort-Mom-Fit-Mid-Rise-Light-Fade-Stretchable-Jeans/31023743/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "24457444-L",
                  "name": "American Eye Cable Knit Cardigan",
                  "price": "₹1439",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/aa235d9c53bf4c91a135742006d346b8.jpg",
                  "brand": {
                    "name": "American Eye",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Sweaters/American+Eye/American-Eye-Cable-Knit-Cardigan/24457444/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "31303147-26",
                  "name": "AAHWAN Women Blue Cotton Wide Leg High-Rise Stretchable Jeans",
                  "price": "₹843",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/a88c7b633cde42d980aacdf54dff7edc.jpg",
                  "brand": {
                    "name": "AAHWAN",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Jeans/AAHWAN/AAHWAN-Women-Blue-Cotton-Wide-Leg-High-Rise-Stretchable-Jeans/31303147/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "19765642-S",
                  "name": "BROOWL Women Grey Woollen Longline Cardigan",
                  "price": "₹3159",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/6b10cd90977e4302b07be4c7e45c9193.jpg",
                  "brand": {
                    "name": "BROOWL",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Sweaters/BROOWL/BROOWL-Women-Grey-Woollen--Longline-Cardigan/19765642/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                }
              ]
            },
            {
              "id": "inf_dinah_001_timeless_002",
              "collectionImage": "https://storage.googleapis.com/glance-ail-avatars-non-prod-cdn/avatar/meeeeeee/id4/conv-local-1/msg-local-111/32f0d.jpg",
              "title": "Timeless Classic Look 1",
              "matchPercentage": 80,
              "prompt": "Polished casual portrait featuring a cotton top with puff sleeves paired with wide-leg jeans and sterling silver jewellery, captured under soft dramatic spotlight on a dark stage.",
              "products": [
                {
                  "id": "31809735-L",
                  "name": "RAREISM Cotton Top",
                  "price": "₹749",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/ecc9d0d0842e43039b9758719c7ddb67.jpg",
                  "brand": {
                    "name": "RAREISM",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Tops/RAREISM/RAREISM-Cotton-Top/31809735/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "26630210-3XL",
                  "name": "Moomaya Puff Sleeve Cotton Shirt Style Top",
                  "price": "₹1231",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/8ffeeb851a4e4fd7bcc1d7161530f7fb.jpg",
                  "brand": {
                    "name": "Moomaya",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Tops/Moomaya/Moomaya-Puff-Sleeve-Cotton-Shirt-Style-Top/26630210/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "27273416-30",
                  "name": "FCK-3 Women Bootilicious Wide Leg High-Rise Clean Look Stretchable Jeans",
                  "price": "₹None",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/a6c242f1fe67418d86d53fa19a184b58.jpg",
                  "brand": {
                    "name": "FCK-3",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Jeans/FCK-3/FCK-3-Women-Bootilicious-Wide-Leg-High-Rise-Clean-Look-Stretchable-Jeans/27273416/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "34647181-S",
                  "name": "SOMYA Sterling Silver Jewellery Set",
                  "price": "₹999",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/7424d51bc2fb40e79cc82a35806e5baf.jpg",
                  "brand": {
                    "name": "SOMYA",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Jewellery-Set/SOMYA/SOMYA-Sterling-Silver-Jewellery-Set/34647181/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "34793845-Onesize",
                  "name": "RAVIOUR LIFESTYLE Brass-Plated Circular Pendants",
                  "price": "₹None",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/991ce3112e0444148cb0089ba01a83dd.jpg",
                  "brand": {
                    "name": "RAVIOUR LIFESTYLE",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Pendant/RAVIOUR+LIFESTYLE/RAVIOUR-LIFESTYLE-Brass-Plated-Circular-Pendants/34793845/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "26250122-XS",
                  "name": "Chemistry Cuban Collar Casual Shirt",
                  "price": "₹399",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/0d17c190bc5a40adade45bc989ddfbe8.jpg",
                  "brand": {
                    "name": "Chemistry",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Shirts/Chemistry/Chemistry-Cuban-Collar-Casual-Shirt/26250122/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                }
              ]
            },
            {
              "id": "inf_dinah_001_timeless_003",
              "collectionImage": "https://storage.googleapis.com/glance-ail-avatars-non-prod-cdn/avatar/meeeeeee/id4/conv-local-1/msg-local-111/0c660.jpg",
              "title": "Timeless Classic Look 2",
              "matchPercentage": 78,
              "prompt": "Effortless everyday look with an abstract printed cotton T-shirt and baggy sailor-fit jeans, accessorized with gold brass bangles, set against a clean white background.",
              "products": [
                {
                  "id": "30450021-L",
                  "name": "Chemistry Printed Pure Cotton T-Shirt",
                  "price": "₹299",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/b2bf8c3017ab45318eedb1070c05f380.jpg",
                  "brand": {
                    "name": "Chemistry",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Tshirts/Chemistry/Chemistry-Printed-Pure-Cotton-T-Shirt/30450021/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "32696993-L",
                  "name": "UMILDO Women Abstract Printed Round Neck T-shirt",
                  "price": "₹503",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/ddd345c5069e45509a4dddc9793d6d2f.jpg",
                  "brand": {
                    "name": "UMILDO",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Tshirts/UMILDO/UMILDO-Women-Abstract-Printed-Round-Neck-T-shirt/32696993/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "31661788-28",
                  "name": "LYRA Women Wide-Leg Baggy Sailor Fit Stretchable Jeans",
                  "price": "₹1080",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/3ec8f2aee9834e6eada9055ee302ef5a.jpg",
                  "brand": {
                    "name": "LYRA",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Jeans/LYRA/LYRA-Women-Wide-Leg-Baggy-Sailor-Fit-Stretchable-Jeans/31661788/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "34663653-2.1",
                  "name": "Shree enterprise Gold Brass Bangle",
                  "price": "₹405",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/d7600e11ea06424c8dbd3988ee5ff66e.jpg",
                  "brand": {
                    "name": "Shree enterprise",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Bangle/Shree+enterprise/Shree-enterprise-Gold-Brass-Bangle/34663653/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "35391534-2.4",
                  "name": "Vidhya Kangan Women White Bangle",
                  "price": "₹340",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/91af0fde78874ab5bce33a571f1910bf.jpg",
                  "brand": {
                    "name": "Vidhya Kangan",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Bangle/Vidhya+Kangan/Vidhya-Kangan-Women-White-Bangle/35391534/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "24227788-L",
                  "name": "Honey by Pantaloons Abstract Printed Cotton T-shirt",
                  "price": "₹474",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/f3452d54ab84483d8d5e0125e163e044.jpg",
                  "brand": {
                    "name": "Honey by Pantaloons",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Tshirts/Honey+by+Pantaloons/Honey-by-Pantaloons-Abstract-Printed-Cotton-T-shirt/24227788/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                }
              ]
            }
          ]
        },
        {
          "id": "dinah_saurr_wardrobe_005",
          "type": "product_grid",
          "contentType": "products",
          "priority": 5,
          "title": "Dinah's Wardrobe",
          "subtitle": "Rare sight at what Dinah has got hidden there",
          "backgroundImage": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop",
          "viewAll": true,
          "items": [
            {
              "id": "32455356-XL",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/ba90939bd1774cb198ff59b6ac23f0f1.jpg",
              "price": "₹899",
              "redirectUrl": "https://www.myntra.com/Sweatshirts/Kotty/Kotty-Women-Printed-Sweatshirt/32455356/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
              "title": "Kotty Women Printed Sweatshirt",
              "actions": [
                {
                  "type": "styleMe",
                  "text": "Style Me",
                  "enabled": true
                },
                {
                  "type": "buy",
                  "text": "BUY",
                  "url": "https://www.myntra.com/Sweatshirts/Kotty/Kotty-Women-Printed-Sweatshirt/32455356/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
                  "enabled": true
                }
              ]
            },
            {
              "id": "32502500-L",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/f97764be35934679a4163c1f5ac7ae18.jpg",
              "price": "₹3117",
              "redirectUrl": "https://www.myntra.com/Tshirts/StyleCast+x+Revolte/StyleCast-x-Revolte-Women-Typography-Printed-Cotton-Tshirts/32502500/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
              "title": "StyleCast x Revolte Women Typography Printed Cotton Tshirts",
              "actions": [
                {
                  "type": "styleMe",
                  "text": "Style Me",
                  "enabled": true
                },
                {
                  "type": "buy",
                  "text": "BUY",
                  "url": "https://www.myntra.com/Tshirts/StyleCast+x+Revolte/StyleCast-x-Revolte-Women-Typography-Printed-Cotton-Tshirts/32502500/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
                  "enabled": true
                }
              ]
            },
            {
              "id": "31891634-M",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/7c57edde84fd42cc880d99f6425277bf.jpg",
              "price": "₹1452",
              "redirectUrl": "https://www.myntra.com/Tops/StyleCast/StyleCast-Women-V-Neck-Shirt-Style-Top/31891634/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
              "title": "StyleCast Women V-Neck Shirt Style Top",
              "actions": [
                {
                  "type": "styleMe",
                  "text": "Style Me",
                  "enabled": true
                },
                {
                  "type": "buy",
                  "text": "BUY",
                  "url": "https://www.myntra.com/Tops/StyleCast/StyleCast-Women-V-Neck-Shirt-Style-Top/31891634/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
                  "enabled": true
                }
              ]
            },
            {
              "id": "31216156-L",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/6a38e41180ea4edfacb5aa5a389b52db.jpg",
              "price": "₹1325",
              "redirectUrl": "https://www.myntra.com/Sweatshirts/LULU+%26+SKY/LULU--SKY-Front-Half-Zip-Oversized-Sweatshirt/31216156/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
              "title": "LULU & SKY Front Half-Zip Oversized Sweatshirt",
              "actions": [
                {
                  "type": "styleMe",
                  "text": "Style Me",
                  "enabled": true
                },
                {
                  "type": "buy",
                  "text": "BUY",
                  "url": "https://www.myntra.com/Sweatshirts/LULU+%26+SKY/LULU--SKY-Front-Half-Zip-Oversized-Sweatshirt/31216156/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
                  "enabled": true
                }
              ]
            },
            {
              "id": "31849643-S",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/4936b0af79dd4a9eb96a4864da165e2a.jpg",
              "price": "₹1151",
              "redirectUrl": "https://www.myntra.com/Sweaters/StyleCast/StyleCast-Women-Cable-Knit-Sweater-Vest/31849643/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
              "title": "StyleCast Women Cable Knit Sweater Vest",
              "actions": [
                {
                  "type": "styleMe",
                  "text": "Style Me",
                  "enabled": true
                },
                {
                  "type": "buy",
                  "text": "BUY",
                  "url": "https://www.myntra.com/Sweaters/StyleCast/StyleCast-Women-Cable-Knit-Sweater-Vest/31849643/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
                  "enabled": true
                }
              ]
            },
            {
              "id": "28571804-L",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/403541b87d6740769385b54851c8a8d3.jpg",
              "price": "₹1538",
              "redirectUrl": "https://www.myntra.com/Tops/StyleCast/StyleCast-Black-High-Neck-Cotton-Top/28571804/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
              "title": "StyleCast Black High Neck Cotton Top",
              "actions": [
                {
                  "type": "styleMe",
                  "text": "Style Me",
                  "enabled": true
                },
                {
                  "type": "buy",
                  "text": "BUY",
                  "url": "https://www.myntra.com/Tops/StyleCast/StyleCast-Black-High-Neck-Cotton-Top/28571804/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
                  "enabled": true
                }
              ]
            },
            {
              "id": "30191357-L",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/41a4c3c785684af98eb2160f0cfbec18.jpg",
              "price": "₹224",
              "redirectUrl": "https://www.myntra.com/Tshirts/DressBerry/DressBerry-Everyday-Essential-Printed-Cotton-Tee/30191357/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
              "title": "DressBerry Everyday Essential Printed Cotton Tee",
              "actions": [
                {
                  "type": "styleMe",
                  "text": "Style Me",
                  "enabled": true
                },
                {
                  "type": "buy",
                  "text": "BUY",
                  "url": "https://www.myntra.com/Tshirts/DressBerry/DressBerry-Everyday-Essential-Printed-Cotton-Tee/30191357/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
                  "enabled": true
                }
              ]
            },
            {
              "id": "31742218-L",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/28eca4b6d2604c9185419a68224b03b8.jpg",
              "price": "₹1169",
              "redirectUrl": "https://www.myntra.com/Tops/DressBerry/DressBerry-Women-Solid-Long-Sleeves-Longline-Top/31742218/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
              "title": "DressBerry Women Solid Long Sleeves Longline Top",
              "actions": [
                {
                  "type": "styleMe",
                  "text": "Style Me",
                  "enabled": true
                },
                {
                  "type": "buy",
                  "text": "BUY",
                  "url": "https://www.myntra.com/Tops/DressBerry/DressBerry-Women-Solid-Long-Sleeves-Longline-Top/31742218/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
                  "enabled": true
                }
              ]
            },
            {
              "id": "31462127-M",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/0283422b7ffc472893493a23c96182ef.jpg",
              "price": "₹1504",
              "redirectUrl": "https://www.myntra.com/Tops/StyleCast/StyleCast-Women-Striped-Halter-Neck-Long-Sleeves-Top/31462127/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
              "title": "StyleCast Women Striped Halter Neck Long Sleeves Top",
              "actions": [
                {
                  "type": "styleMe",
                  "text": "Style Me",
                  "enabled": true
                },
                {
                  "type": "buy",
                  "text": "BUY",
                  "url": "https://www.myntra.com/Tops/StyleCast/StyleCast-Women-Striped-Halter-Neck-Long-Sleeves-Top/31462127/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
                  "enabled": true
                }
              ]
            },
            {
              "id": "30267589-L",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/a6151c8e1d0e4550af78b1e49b3c8c46.jpg",
              "price": "₹498",
              "redirectUrl": "https://www.myntra.com/Sweaters/TANDUL/TANDUL-Women-Ribbed-Turtle-Neck-Cotton-Pullover/30267589/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
              "title": "TANDUL Women Ribbed Turtle Neck Cotton Pullover",
              "actions": [
                {
                  "type": "styleMe",
                  "text": "Style Me",
                  "enabled": true
                },
                {
                  "type": "buy",
                  "text": "BUY",
                  "url": "https://www.myntra.com/Sweaters/TANDUL/TANDUL-Women-Ribbed-Turtle-Neck-Cotton-Pullover/30267589/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
                  "enabled": true
                }
              ]
            }
          ]
        },
        {
          "id": "dinah_saurr_funkCollection_006",
          "type": "look_collection",
          "contentType": "looks+products",
          "priority": 6,
          "title": "The Funk Collection",
          "subtitle": "Let your imagination run wild",
          "items": [
            {
              "id": "inf_dinah_001_funk_000",
              "collectionImage": "https://storage.googleapis.com/glance-ail-avatars-non-prod-cdn/avatar/meeeeeee/id4/conv-local-1/msg-local-111/dc2b4.jpg",
              "title": "Funk Collection",
              "description": "Bold and vibrant streetwear collection with unique style",
              "prompt": "Street style shot of a young woman in an edgy rib knit hooded crop top paired with wide-leg lounge pants and a textured waist chain, set against a gritty urban backdrop with bold lighting.",
              "products": [
                {
                  "id": "31551770-L",
                  "name": "glitchez Edgy Rib Knit Hooded Crop Top",
                  "price": "₹339",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/b1d0ad15554d405b8c7e31f99988bb79.jpg",
                  "brand": {
                    "name": "glitchez",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Tops/glitchez/glitchez-Edgy-Rib-Knit-Hooded-Crop-Top/31551770/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "23469830-M",
                  "name": "Harvard Front-Open Hooded Cropped Sweatshirt",
                  "price": "₹479",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/00e07b8898bd4cbeb14b07c8e36bb5e1.jpg",
                  "brand": {
                    "name": "Harvard",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Sweatshirts/Harvard/Harvard-Front-Open-Hooded-Cropped-Sweatshirt/23469830/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "31449322-5XL",
                  "name": "SPIRIT ANIMAL Plus Size Mid-Rise Relax Fit Wide Leg Lounge Pants",
                  "price": "₹1763",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/83ef71b2077f444095408990ecdf590f.jpg",
                  "brand": {
                    "name": "SPIRIT ANIMAL",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Lounge-Pants/SPIRIT+ANIMAL/SPIRIT-ANIMAL-Plus-Size-Mid-Rise-Relax-Fit-Wide-Leg--Lounge-Pants/31449322/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "30316760-Onesize",
                  "name": "SYGA Texture Design Waist Chain",
                  "price": "₹421",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/c99798e944604fb4a8554f37a92697b9.jpg",
                  "brand": {
                    "name": "SYGA",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Saree-Accessories/SYGA/SYGA-Texture-Design-Waist-Chain/30316760/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "26998612-30",
                  "name": "STREET 9 Women Relaxed Loose Fit Pleated Culottes Trousers",
                  "price": "₹475",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/66efaba1cdc34a789d5fa04774fc4068.jpg",
                  "brand": {
                    "name": "STREET 9",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Trousers/STREET+9/STREET-9-Women-Relaxed-Loose-Fit-Pleated-Culottes-Trousers/26998612/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                }
              ],
              "actions": [
                {
                  "type": "ask",
                  "text": "ASK DINAH",
                  "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/AskInfluencer.webp"
                },
                {
                  "type": "tryOn",
                  "text": "TRY ON",
                  "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/AskInfluencer.webp"
                }
              ]
            },
            {
              "id": "inf_dinah_001_funk_001",
              "collectionImage": "https://storage.googleapis.com/glance-ail-avatars-non-prod-cdn/avatar/meeeeeee/id4/conv-local-1/msg-local-111/c2d28.jpg",
              "title": "Funk Collection Look 1",
              "description": "Bold and vibrant streetwear collection with unique style",
              "prompt": "Playful streetwear editorial featuring a printed crop tee with flowy wide-waistband flared trousers, an oxidised silver cuff bracelet, and grey running shoes, shot in a vibrant outdoor setting.",
              "products": [
                {
                  "id": "30191253-M",
                  "name": "DressBerry Edgy Essentials Printed Crop Tee",
                  "price": "₹207",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/28a8552c9e004345953c132e8057f747.jpg",
                  "brand": {
                    "name": "DressBerry",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Tshirts/DressBerry/DressBerry-Edgy-Essentials-Printed-Crop-Tee/30191253/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "30933776-28",
                  "name": "DressBerry Women Flowy Wide Waistband Flared Trousers",
                  "price": "₹719",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/b9f084949521498eb53a1aa8a0bc19f1.jpg",
                  "brand": {
                    "name": "DressBerry",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Trousers/DressBerry/DressBerry-Women-Flowy-Wide-Waistband-Flared-Trousers/30933776/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "32770975-Onesize",
                  "name": "Sangria German Silver-Plated Textured Oxidised Cuff Bracelet",
                  "price": "₹324",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/d3b1d81028da47cd942445f440250212.jpg",
                  "brand": {
                    "name": "Sangria",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Bracelet/Sangria/Sangria-German-Silver-Plated-Textured-Oxidised-Cuff-Bracelet/32770975/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "26527850-4",
                  "name": "Roadster Women Grey & White Lightweight Running Shoes",
                  "price": "₹1241",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/23267050aba1473ba04e92b4a5818d37.jpg",
                  "brand": {
                    "name": "Roadster",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Sports-Shoes/Roadster/The-Roadster-Lifestyle-Co-Women-Grey--White-Lightweight-Running-Shoes/26527850/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "32490422-M",
                  "name": "SPYKAR Women Typography Printed Round Neck Cotton Boxy T-shirt",
                  "price": "₹587",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/068b2e529d85471db8a5603a6c427f6d.jpg",
                  "brand": {
                    "name": "SPYKAR",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Tshirts/SPYKAR/SPYKAR-Women-Typography-Printed-Round-Neck-Cotton-Boxy-T-shirt/32490422/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                }
              ],
              "actions": [
                {
                  "type": "ask",
                  "text": "ASK DINAH",
                  "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/AskInfluencer.webp"
                },
                {
                  "type": "tryOn",
                  "text": "TRY ON",
                  "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/AskInfluencer.webp"
                }
              ]
            },
            {
              "id": "inf_dinah_001_funk_002",
              "collectionImage": "https://storage.googleapis.com/glance-ail-avatars-non-prod-cdn/avatar/meeeeeee/id4/conv-local-1/msg-local-111/5d0c6.jpg",
              "title": "Funk Collection Look 2",
              "description": "Eclectic mix of oversized shirts and bold accessories for a relaxed statement",
              "prompt": "Urban casual look with a drop-shoulder boxy fit shirt layered over red cotton shorts, accessorized with a silver stainless steel necklace, captured in a sunlit industrial alleyway.",
              "products": [
                {
                  "id": "30168389-40",
                  "name": "Kook N Keech Edgy Style Drop-Shoulder Boxy Fit Shirt",
                  "price": "₹674",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/5fbc279c1c7242c58b955d9d3e802279.jpg",
                  "brand": {
                    "name": "Kook N Keech",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Shirts/Kook+N+Keech/Kook-N-Keech-Edgy-Style-Drop-Shoulder-Boxy-Fit-Shirt/30168389/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "29859230-L",
                  "name": "Bewakoof Spread Collar Short Sleeves Oversized Casual Shirt",
                  "price": "₹499",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/07a6998e0b014a95afdb755ee7891921.jpg",
                  "brand": {
                    "name": "Bewakoof",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Shirts/Bewakoof/Bewakoof-Spread-Collar-Short-Sleeves-Oversized-Casual-Shirt/29859230/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "18746806-26",
                  "name": "BRINNS Women Red Solid Cotton Shorts",
                  "price": "₹764",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/0a5c8c1c885f419bb7adcac69aba0855.jpg",
                  "brand": {
                    "name": "BRINNS",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Shorts/BRINNS/BRINNS-Women-Red-Solid-Cotton-Shorts/18746806/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "25942618-Onesize",
                  "name": "Designs & You Silver Plated Stainless Steel Necklace",
                  "price": "₹455",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/21578fcf1b5c473798d53f3b532bf5b1.jpg",
                  "brand": {
                    "name": "Designs & You",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Necklace-and-Chains/Designs+%26+You/Designs--You-Silver-Plated-Stainless-Steel-Necklace/25942618/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "23690d84-74ba-520f-ab20-e05c2c209066",
                  "name": "Rareism Women's Elcee Olive Viscose Collared Neck Regular Fit Shirt",
                  "price": "₹974",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/03/03138f32bf76466e4bcd5b8f4adeb6d0ae35e919.jpg",
                  "brand": {
                    "name": "THE HOUSE OF RARE",
                    "logo": ""
                  },
                  "redirectUrl": "https://thehouseofrare.com/products/elcee-womens-shirt-olive?openType=1&ijs=1&cid={CLICK_ID}&imc_clid={GAID}&gl_id={USER_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "32483779-44",
                  "name": "NOTWILD Women Printed Low-Rise Shorts",
                  "price": "₹None",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/b1597785729048c088a238ecc305e1d2.jpg",
                  "brand": {
                    "name": "NOTWILD",
                    "logo": ""
                  },
                  "redirectUrl": "https://www.myntra.com/Shorts/NOTWILD/NOTWILD-Women-Printed-Low-Rise-Shorts/32483779/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                }
              ],
              "actions": [
                {
                  "type": "ask",
                  "text": "ASK DINAH",
                  "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/AskInfluencer.webp"
                },
                {
                  "type": "tryOn",
                  "text": "TRY ON",
                  "icon": "https://x-stg.glance-cdn.com/public/content/assets/other/AskInfluencer.webp"
                }
              ]
            }
          ]
        },
        {
          "id": "billie_eilish_look_grid_005",
          "type": "look_grid",
          "priority": 7,
          "viewAll": true,
          "title": "Ellie's Look Grid",
          "subtitle": "Curated looks to inspire your next outfit",
          "description": "Curated collection of timeless and classic looks recommended by the influencer, featuring versatile pieces that define their signature style",
          "backgroundImage": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop",
          "items": [
            {
              "id": "4b285a32-eeec-42aa-9ba7-69151790eff4",
              "collectionImage": "https://m-us-mob-ailooks-non-prod.glance-cdn.com/avatar/data_refresh_inf_billie_001/inf_billie_001_profile/15b902fa-cf83-4311-adda-2d25051580a7/15b902fa-cf83-4311-adda-2d25051580a7/8daf9.jpg",
              "prompt": "The person in Image 1 wearing the product/garment from Image 2. Generate a high-fashion vertical (9:16) studio editorial image. Based on the person in the reference image, she stands with a poised, confident posture, embodying a minimal, modern luxury streetwear aesthetic, reminiscent of clean magazine covers. She is framed waist-up, positioned slightly off-center within a high-end fashion studio featuring a sleek marble floor. The outfit includes a black mandarin collar top, with styling kept minimal to highlight its silhouette and fabric. Soft yet directional lighting bathes the scene, creating gentle shadows and a polished editorial atmosphere with cool muted tones. No text or typography is included in the image. Style: premium fashion editorial photography with a sophisticated, aspirational feel.",
              "date": "2026-04-02T07:14:21.657572824Z",
              "products": [
                {
                  "id": "0b84c4fb-13f5-55c7-bac1-ae527c0adc51",
                  "name": "Rareism Women's Kella Black Mandarin Collar Plain Raglan Sleeve Regular Fit Top",
                  "price": "₹1999",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/03/c2eed5e087fc53247a77b2763d3cbe9d6b004df7.jpg",
                  "ai_look": null,
                  "brand": {
                      "name": "THE HOUSE OF RARE",
                      "logo": "null"
                  },
                  "redirectUrl": "https://thehouseofrare.com/products/kella-womens-top-black?openType=1&ijs=1&cid={CLICK_ID}&imc_clid={GAID}&gl_id={USER_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "15884798-L",
                  "name": "STREET 9 Women Bright Fuchsia Solid Satin Top",
                  "price": "₹1599",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/ff5737a9eee649728db342c9a71ecc9b.jpg",
                  "ai_look": null,
                  "brand": {
                      "name": "STREET 9",
                      "logo": "null"
                  },
                  "redirectUrl": "https://www.myntra.com/Tops/STREET+9/STREET-9-Women-Bright-Fuchsia-Solid-Satin-Top/15884798/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "19972406-L",
                  "name": "HAUTE SAUCE by Campus Sutra HAUTE SAUCE by Campus",
                  "price": "₹997",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/69d9c3aa8b2a480d9d9eb215d99461bd.jpg",
                  "ai_look": null,
                  "brand": {
                      "name": "HAUTE SAUCE by  Campus Sutra",
                      "logo": "null"
                  },
                  "redirectUrl": "https://www.myntra.com/Sunglasses/HAUTE+SAUCE+by++Campus+Sutra/HAUTE-SAUCE-by-Campus-Sutra-Women-Clear-Lens--White-Wayfarer-Sunglasses-with-Polarised-Lens/19972406/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "25216988-L",
                  "name": "MINT STREET Self Design Mandarin Collar Top",
                  "price": "₹1899",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/eff8635aaf6f4591aa871b4122320d25.jpg",
                  "ai_look": null,
                  "brand": {
                      "name": "MINT STREET",
                      "logo": "null"
                  },
                  "redirectUrl": "https://www.myntra.com/Tops/MINT+STREET/MINT-STREET-Self-Design-Mandarin-Collar-Top/25216988/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "28495270-25",
                  "name": "Mlada Women Cotton Regular Fit Mid-Rise All Day Trousers",
                  "price": "₹3499",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/a96d6215f04a47d690e622cdc084c77d.jpg",
                  "ai_look": null,
                  "brand": {
                      "name": "Mlada",
                      "logo": "null"
                  },
                  "redirectUrl": "https://www.myntra.com/Trousers/Mlada/Mlada-Women-Cotton-Regular-Fit-Mid-Rise-All-Day-Trousers/28495270/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                },
                {
                  "id": "31060114-36",
                  "name": "HF JOURNEY Women T strap Red Comfort cork Sandals",
                  "price": "₹2990",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/5168ec82f98849ea95fea13ed7c857e8.jpg",
                  "ai_look": null,
                  "brand": {
                      "name": "HF JOURNEY",
                      "logo": "null"
                  },
                  "redirectUrl": "https://www.myntra.com/Flats/HF+JOURNEY/HF-JOURNEY-Women-T-strap-Red-Comfort-cork-Sandals/31060114/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}"
                }
              ],
              "actions": [
                {
                  "type": "ASK",
                  "text": "Ask",
                  "enabled": true
                },
                {
                  "type": "TRY_ON",
                  "text": "Try On",
                  "enabled": true
                }
              ]
            },
          ]
        },
        {
          "id": "dinah_saurr_wardrobe_005_2",
          "type": "product_grid",
          "contentType": "products",
          "priority": 8,
          "title": "Dinah's Wardrobe Essentials",
          "subtitle": "Must-have picks from the collection",
          "backgroundImage": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=400&fit=crop",
          "viewAll": true,
          "items": [
            {
              "id": "32455356-XL",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/ba90939bd1774cb198ff59b6ac23f0f1.jpg",
              "price": "₹899",
              "redirectUrl": "https://www.myntra.com/Sweatshirts/Kotty/Kotty-Women-Printed-Sweatshirt/32455356/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
              "title": "Kotty Women Printed Sweatshirt",
              "actions": [
                {
                  "type": "styleMe",
                  "text": "Style Me",
                  "enabled": true
                },
                {
                  "type": "buy",
                  "text": "BUY",
                  "url": "https://www.myntra.com/Sweatshirts/Kotty/Kotty-Women-Printed-Sweatshirt/32455356/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
                  "enabled": true
                }
              ]
            },
            {
              "id": "32502500-L",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/f97764be35934679a4163c1f5ac7ae18.jpg",
              "price": "₹3117",
              "redirectUrl": "https://www.myntra.com/Tshirts/StyleCast+x+Revolte/StyleCast-x-Revolte-Women-Typography-Printed-Cotton-Tshirts/32502500/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
              "title": "StyleCast x Revolte Women Typography Printed Cotton Tshirts",
              "actions": [
                {
                  "type": "styleMe",
                  "text": "Style Me",
                  "enabled": true
                },
                {
                  "type": "buy",
                  "text": "BUY",
                  "url": "https://www.myntra.com/Tshirts/StyleCast+x+Revolte/StyleCast-x-Revolte-Women-Typography-Printed-Cotton-Tshirts/32502500/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
                  "enabled": true
                }
              ]
            },
            {
              "id": "31891634-M",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/7c57edde84fd42cc880d99f6425277bf.jpg",
              "price": "₹1452",
              "redirectUrl": "https://www.myntra.com/Tops/StyleCast/StyleCast-Women-V-Neck-Shirt-Style-Top/31891634/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
              "title": "StyleCast Women V-Neck Shirt Style Top",
              "actions": [
                {
                  "type": "styleMe",
                  "text": "Style Me",
                  "enabled": true
                },
                {
                  "type": "buy",
                  "text": "BUY",
                  "url": "https://www.myntra.com/Tops/StyleCast/StyleCast-Women-V-Neck-Shirt-Style-Top/31891634/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
                  "enabled": true
                }
              ]
            },
            {
              "id": "31216156-L",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/6a38e41180ea4edfacb5aa5a389b52db.jpg",
              "price": "₹1325",
              "redirectUrl": "https://www.myntra.com/Sweatshirts/LULU+%26+SKY/LULU--SKY-Front-Half-Zip-Oversized-Sweatshirt/31216156/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
              "title": "LULU & SKY Front Half-Zip Oversized Sweatshirt",
              "actions": [
                {
                  "type": "styleMe",
                  "text": "Style Me",
                  "enabled": true
                },
                {
                  "type": "buy",
                  "text": "BUY",
                  "url": "https://www.myntra.com/Sweatshirts/LULU+%26+SKY/LULU--SKY-Front-Half-Zip-Oversized-Sweatshirt/31216156/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
                  "enabled": true
                }
              ]
            },
            {
              "id": "31849643-S",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/4936b0af79dd4a9eb96a4864da165e2a.jpg",
              "price": "₹1151",
              "redirectUrl": "https://www.myntra.com/Sweaters/StyleCast/StyleCast-Women-Cable-Knit-Sweater-Vest/31849643/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
              "title": "StyleCast Women Cable Knit Sweater Vest",
              "actions": [
                {
                  "type": "styleMe",
                  "text": "Style Me",
                  "enabled": true
                },
                {
                  "type": "buy",
                  "text": "BUY",
                  "url": "https://www.myntra.com/Sweaters/StyleCast/StyleCast-Women-Cable-Knit-Sweater-Vest/31849643/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
                  "enabled": true
                }
              ]
            },
            {
              "id": "28571804-L",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/403541b87d6740769385b54851c8a8d3.jpg",
              "price": "₹1538",
              "redirectUrl": "https://www.myntra.com/Tops/StyleCast/StyleCast-Black-High-Neck-Cotton-Top/28571804/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
              "title": "StyleCast Black High Neck Cotton Top",
              "actions": [
                {
                  "type": "styleMe",
                  "text": "Style Me",
                  "enabled": true
                },
                {
                  "type": "buy",
                  "text": "BUY",
                  "url": "https://www.myntra.com/Tops/StyleCast/StyleCast-Black-High-Neck-Cotton-Top/28571804/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
                  "enabled": true
                }
              ]
            },
            {
              "id": "30191357-L",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/41a4c3c785684af98eb2160f0cfbec18.jpg",
              "price": "₹224",
              "redirectUrl": "https://www.myntra.com/Tshirts/DressBerry/DressBerry-Everyday-Essential-Printed-Cotton-Tee/30191357/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
              "title": "DressBerry Everyday Essential Printed Cotton Tee",
              "actions": [
                {
                  "type": "styleMe",
                  "text": "Style Me",
                  "enabled": true
                },
                {
                  "type": "buy",
                  "text": "BUY",
                  "url": "https://www.myntra.com/Tshirts/DressBerry/DressBerry-Everyday-Essential-Printed-Cotton-Tee/30191357/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
                  "enabled": true
                }
              ]
            },
            {
              "id": "31742218-L",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/28eca4b6d2604c9185419a68224b03b8.jpg",
              "price": "₹1169",
              "redirectUrl": "https://www.myntra.com/Tops/DressBerry/DressBerry-Women-Solid-Long-Sleeves-Longline-Top/31742218/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
              "title": "DressBerry Women Solid Long Sleeves Longline Top",
              "actions": [
                {
                  "type": "styleMe",
                  "text": "Style Me",
                  "enabled": true
                },
                {
                  "type": "buy",
                  "text": "BUY",
                  "url": "https://www.myntra.com/Tops/DressBerry/DressBerry-Women-Solid-Long-Sleeves-Longline-Top/31742218/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
                  "enabled": true
                }
              ]
            },
            {
              "id": "31462127-M",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/0283422b7ffc472893493a23c96182ef.jpg",
              "price": "₹1504",
              "redirectUrl": "https://www.myntra.com/Tops/StyleCast/StyleCast-Women-Striped-Halter-Neck-Long-Sleeves-Top/31462127/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
              "title": "StyleCast Women Striped Halter Neck Long Sleeves Top",
              "actions": [
                {
                  "type": "styleMe",
                  "text": "Style Me",
                  "enabled": true
                },
                {
                  "type": "buy",
                  "text": "BUY",
                  "url": "https://www.myntra.com/Tops/StyleCast/StyleCast-Women-Striped-Halter-Neck-Long-Sleeves-Top/31462127/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
                  "enabled": true
                }
              ]
            },
            {
              "id": "30267589-L",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/a6151c8e1d0e4550af78b1e49b3c8c46.jpg",
              "price": "₹498",
              "redirectUrl": "https://www.myntra.com/Sweaters/TANDUL/TANDUL-Women-Ribbed-Turtle-Neck-Cotton-Pullover/30267589/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
              "title": "TANDUL Women Ribbed Turtle Neck Cotton Pullover",
              "actions": [
                {
                  "type": "styleMe",
                  "text": "Style Me",
                  "enabled": true
                },
                {
                  "type": "buy",
                  "text": "BUY",
                  "url": "https://www.myntra.com/Sweaters/TANDUL/TANDUL-Women-Ribbed-Turtle-Neck-Cotton-Pullover/30267589/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}",
                  "enabled": true
                }
              ]
            }
          ]
        }
      ]
    }
  },
  "metadata": {
    "lastUpdated": "2024-01-15T12:00:00Z",
    "totalProducts": 66,
    "aiPoweredBy": {
      "text": "POWERED BY",
      "logo": "https://x-stg.glance-cdn.com/public/content/assets/other/glance-logo.png"
    }
  },
  "footerData": {
    "googlePlayLink": "https://play.google.com/store/apps/details?id=com.glance.ai&hl=en_IN",
    "appStoreLink": "https://apps.apple.com/in/app/glance-shop-with-ai/id6742974181",
    "privacyPolicyLink": "https://inmobi.com/privacy-policy/",
    "termsOfServiceLink": "https://inmobi.com/terms-of-service/",
    "copyrightText": "© All rights reserved.",
    "instagramLink": "https://www.instagram.com/inmobi_influencer/",
    "linkedInLink": "https://www.linkedin.com/company/inmobi/",
    "twitterLink": "https://twitter.com/inmobi_influencer",
    "oneLinkUrl": "https://glanceai.onelink.me/HNrD/4u9vifm9"
  }
} as const satisfies InfluencerResponse;

/**
 * Returns mock influencer data for a given slug.
 * When the backend is ready or USE_MOCK_INFLUENCER_DATA is false,
 * the real API call will be used instead.
 */
export function getMockInfluencerData(slug: string): InfluencerResponse {
  // Check if mock data exists for this slug
  if (mockInfluencerData.influencers[slug]) {
    return mockInfluencerData;
  }

  // Return a generic mock if slug not found
  return {
    ...mockInfluencerData,
    influencers: {
      [slug]: {
        ...mockInfluencerData.influencers['dinah-saurr'],
        influencer: {
          ...mockInfluencerData.influencers['dinah-saurr'].influencer,
          slug,
        },
      },
    },
  };
}
