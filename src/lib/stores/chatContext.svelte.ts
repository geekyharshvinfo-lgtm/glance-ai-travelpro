export interface ChatContextProduct {
  id: string;
  name: string;
  image: string;
}

class ChatContextStore {
  product = $state<ChatContextProduct | null>(null);

  setProduct(product: ChatContextProduct) {
    this.product = product;
  }

  clearProduct() {
    this.product = null;
  }

  reset() {
    this.product = null;
  }
}

export const chatContext = new ChatContextStore();
