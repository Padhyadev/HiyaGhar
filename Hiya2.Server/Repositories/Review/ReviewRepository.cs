using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;

namespace Hiya2.Server.Repositories.Review
{
    public class ReviewRepository : IReviewRepository
    {
        private readonly DataContext _context;

        public ReviewRepository(DataContext context)
        {
            _context = context;
        }

        public async Task<(List<Models.Review> Reviews, double AverageRating, int TotalCount)> GetByProductAsync(int productId)
        {
            var query = _context.Reviews
                .Where(r => r.ProductId == productId && !r.IsDeleted && r.IsActive);

            var reviews = await query
                .Include(r => r.Customer)
                .OrderByDescending(r => r.CreatedDate)
                .ToListAsync();

            var totalCount = reviews.Count;
            var averageRating = totalCount > 0 ? reviews.Average(r => r.Rating) : 0;

            return (reviews, averageRating, totalCount);
        }

        public async Task<Models.Review> AddAsync(long customerId, int productId, int rating, string reviewText)
        {
            var review = new Models.Review
            {
                CustomerId = customerId,
                ProductId = productId,
                Rating = rating,
                ReviewText = reviewText,
                IsActive = true,
                IsDeleted = false,
                CreatedBy = customerId,
                CreatedDate = DateTime.Now
            };

            await _context.Reviews.AddAsync(review);
            await _context.SaveChangesAsync();

            await RecalculateProductRatingAsync(productId);

            return review;
        }

        public async Task<List<Models.Review>> GetAllForAdminAsync()
        {
            return await _context.Reviews
                .Where(r => !r.IsDeleted)
                .Include(r => r.Customer)
                .Include(r => r.Product)
                .OrderByDescending(r => r.CreatedDate)
                .ToListAsync();
        }

        public async Task<List<Models.Review>> GetFeaturedReviewsAsync(int limit = 10)
        {
            return await _context.Reviews
                .Where(r => !r.IsDeleted && r.IsActive && r.Rating >= 4)
                .Include(r => r.Customer)
                .Include(r => r.Product)
                .OrderByDescending(r => r.CreatedDate)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<(double AverageRating, int TotalReviews)> GetOverallStatsAsync()
        {
            var query = _context.Reviews.Where(r => !r.IsDeleted && r.IsActive);
            var count = await query.CountAsync();
            if (count == 0) return (5.0, 0);

            var avg = await query.AverageAsync(r => r.Rating);
            return (Math.Round(avg, 1), count);
        }

        public async Task<bool> DeleteAsync(long reviewId)
        {
            var review = await _context.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId && !r.IsDeleted);
            if (review == null) return false;

            review.IsActive = false;
            review.IsDeleted = true;
            review.LastModifiedDate = DateTime.Now;
            await _context.SaveChangesAsync();

            await RecalculateProductRatingAsync(review.ProductId);
            return true;
        }

        public async Task<bool> SetActiveAsync(long reviewId, bool isActive)
        {
            var review = await _context.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId && !r.IsDeleted);
            if (review == null) return false;

            review.IsActive = isActive;
            review.LastModifiedDate = DateTime.Now;
            await _context.SaveChangesAsync();

            await RecalculateProductRatingAsync(review.ProductId);
            return true;
        }

        private async Task RecalculateProductRatingAsync(int productId)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == productId);
            if (product == null) return;

            var activeReviews = await _context.Reviews
                .Where(r => r.ProductId == productId && !r.IsDeleted && r.IsActive)
                .Select(r => r.Rating)
                .ToListAsync();

            product.ReviewCount = activeReviews.Count;
            product.Rating = activeReviews.Count > 0 ? (decimal)activeReviews.Average() : 0m;
            product.LastModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
        }
    }
}
