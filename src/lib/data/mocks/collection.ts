import type { CollectionData, SelectedForYouProduct } from '$lib/types';

const generateSelectedForYouProducts = (count: number): SelectedForYouProduct[] => {
  const brands = ['Da Milano England', 'Gucci', 'Prada', 'Louis Vuitton', 'Versace', 'Dior'];
  const prices = ['$120', '$250', '$180', '$320', '$95', '$450', '$275', '$160'];

  return Array.from({ length: count }, (_, index) => ({
    id: `selected-product-${index + 1}`,
    lookImage:
      'https://x-stg.glance-cdn.com/public/content/assets/other/influencer-collection-look.png',
    productImage: 'https://x-stg.glance-cdn.com/public/content/assets/other/be-timeless-item-1.png',
    name: brands[index % brands.length],
    price: prices[index % prices.length],
    productRedirectUrl: `https://example.com/product/${index + 1}`,
  }));
};

export const mockCollectionData: CollectionData = {
  influencerSlug: 'default',
  sections: {
    hero: {
      id: 'mock-hero',
      type: 'hero',
      priority: 1,
      backgroundImage: 'https://x-stg.glance-cdn.com/public/content/assets/other/billie-hero.webp',
      askButton: {
        text: 'STYLE ME',
        icon: 'https://x-stg.glance-cdn.com/public/content/assets/other/style-me-white-icon.svg',
      },
      shopTheProducts: {
        label: 'Shop the products',
        products: [
          {
            id: '30208315-L',
            name: 'Dream Beauty Fashion Checked Top',
            price: '₹224',
            image:
              'https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/e60d3d863b6d47348969f2f858fa0dff.jpg',
            brand: {
              name: 'Dream Beauty Fashion',
              logo: '',
            },
            productRedirectUrl:
              'https://www.myntra.com/Tops/Dream+Beauty+Fashion/Dream-Beauty-Fashion-Checked-Top/30208315/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}',
          },
          {
            id: '30640033-30',
            name: 'FITHUB Women Slim Fit High-Rise Wrinkle Free Trousers',
            price: '₹711',
            image:
              'https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/0f4de66c999f475aa9feae19bcab339e.jpg',
            brand: {
              name: 'FITHUB',
              logo: '',
            },
            productRedirectUrl:
              'https://www.myntra.com/Trousers/FITHUB/FITHUB-Women-Slim-Fit-High-Rise-Wrinkle-Free-Trousers/30640033/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}',
          },
          {
            id: '21341728-Onesize',
            name: 'Yellow Chimes Triple Layered Waist Chain',
            price: '₹541',
            image:
              'https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/f7b3e9cc5e324f698d86eaffd8d6fd07.jpg',
            brand: {
              name: 'Yellow Chimes',
              logo: '',
            },
            productRedirectUrl:
              'https://www.myntra.com/Trousers/FITHUB/FITHUB-Women-Slim-Fit-High-Rise-Wrinkle-Free-Trousers/30640033/buy?openType=1&ijs=1&cid={CLICK_ID}&utm_source=glance&utm_medium={UTM_MEDIUM}',
          },
        ],
      },
    },
    selectedForYou: {
      title: 'Selected for you',
      subtitle: 'Based on your browsing history',
      products: generateSelectedForYouProducts(13),
    },
  },
};

/**
 * Returns mock collection data for a given influencer slug.
 * When the backend is ready, this can be replaced with a real API call.
 */
export function getMockCollectionData(slug: string): CollectionData {
  return {
    ...mockCollectionData,
    influencerSlug: slug,
  };
}
