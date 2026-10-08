import { CustomerAuthService } from './customerAuthService';

export interface ProductReview {
  id: number;
  customerName: string;
  rating: number;
  reviewText: string;
  createdDate: string;
}

export interface ProductReviewsResult {
  averageRating: number;
  totalReviews: number;
  reviews: ProductReview[];
}

export class ReviewApiService {
  public static async getProductReviews(productId: number | string): Promise<ProductReviewsResult> {
    try {
      const res = await fetch(`/api/review/product/${productId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.isSuccess) {
        return { averageRating: 0, totalReviews: 0, reviews: [] };
      }
      return {
        averageRating: data.averageRating || 0,
        totalReviews: data.totalReviews || 0,
        reviews: Array.isArray(data.reviews) ? data.reviews : [],
      };
    } catch (err) {
      console.warn('Failed to fetch product reviews:', err);
      return { averageRating: 0, totalReviews: 0, reviews: [] };
    }
  }

  public static async submitReview(
    productId: number | string,
    rating: number,
    reviewText: string
  ): Promise<{ success: boolean; message?: string }> {
    if (!CustomerAuthService.isLoggedIn()) {
      return { success: false, message: 'Please log in to write a review.' };
    }

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: CustomerAuthService.getAuthHeaders(),
        body: JSON.stringify({ productId: Number(productId), rating, reviewText }),
      });
      const data = await res.json().catch(() => ({}));
      return { success: res.ok && data?.isSuccess, message: data?.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error while submitting review.' };
    }
  }
}
