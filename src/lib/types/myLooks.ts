export interface MyLookItem {
  id: string;
  imageUrl: string;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  metadata: string; // JSON string containing product details, try-on parameters, etc.
}

export interface MyLooksApiResponse {
  userId: string;
  profileId: string;
  totalLooks: number;
  looks: MyLookItem[];
}
