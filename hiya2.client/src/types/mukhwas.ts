export interface MukhwasProduct {
  id: string;
  name: string;
  category: 'sweet' | 'masala' | 'special';
  categoryLabel: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  rating: number;
  reviewsCount: number;
  image: string;
  secondaryImage?: string;
  shortDescription: string;
  longDescription: string;
  weightOptions: string[];
  selectedWeight?: string;
  variants?: any[];
  badge?: 'Best Seller' | 'New' | 'Popular' | 'Trending' | 'Healthy Choice';
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  ingredients?: string[];
  benefits?: string[];
  nutritionalInfo: {
    energy: string;
    carbs: string;
    protein: string;
    fat: string;
    fiber: string;
  };
}
