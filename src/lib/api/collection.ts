import type { CollectionData, SuggestedProduct, ProductSuggestionRequest } from '$lib/types';
import { api } from './client';

/**
 * Fetches collection data for a given influencer slug.
 * Fetches product suggestions based on the provided parameters.
 */
export async function getCollectionBySlug(
  slug: string,
  productSuggestionParams: ProductSuggestionRequest,
  fetchFn?: typeof fetch
): Promise<CollectionData> {
  const collectionData = { influencerSlug: slug, sections: {} } as CollectionData;
  try {
    const options = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const suggestedProducts = await api.post<SuggestedProduct[]>(
      '/influencers/products/suggest-images',
      productSuggestionParams,
      options,
      fetchFn
    );

    // Convert API suggestions to SelectedForYouProduct format
    const convertedProducts = suggestedProducts.map((product) => ({
      id: product.id,
      lookImage: product.imageUrl,
      productImage: product.alternateImageUrls[0] || product.imageUrl,
      name: `${product.brand} ${product.name}`,
      price: `${product.price.currency}${product.price.discountPrice || product.price.price}`,
      productRedirectUrl: product.deeplinkUrl,
    }));

    // Replace the selectedForYou products with API data
    return {
      ...collectionData,
      sections: {
        ...collectionData.sections,
        selectedForYou: {
          title: 'Selected for you',
          subtitle: 'Based on your browsing history',
          products: convertedProducts,
        },
      },
    };
  } catch (error) {
    console.warn('Failed to fetch product suggestions:', error);
    // Return collection data without suggestions on error
    return collectionData;
  }
}
