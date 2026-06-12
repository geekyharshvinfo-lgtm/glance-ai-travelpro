/**
 * Navigation store for handling product selection across pages
 */
import type { HeroProduct } from '$lib/types';

class NavigationStore {
  selectedProductId = $state<string | null>(null);
  selectedHeroImage = $state<string | null>(null);
  generatedLook = $state<string | null>(null);
  heroProducts = $state<HeroProduct[]>([]);

  setSelectedProductId(productId: string) {
    this.selectedProductId = productId;
  }

  setSelectedHeroImage(heroImage: string) {
    this.selectedHeroImage = heroImage;
  }

  setSelectedProduct(
    productId: string,
    heroImage: string,
    heroProducts: HeroProduct[] = [],
    generatedLook: string | null = null
  ) {
    this.selectedProductId = productId;
    this.selectedHeroImage = heroImage;
    this.heroProducts = heroProducts;
    this.generatedLook = generatedLook;
  }

  setHeroProducts(products: HeroProduct[]) {
    this.heroProducts = products;
  }

  clearSelectedProduct() {
    this.selectedProductId = null;
    this.selectedHeroImage = null;
    this.heroProducts = [];
    this.generatedLook = null;
  }
}

export const navigationStore = new NavigationStore();
