using Hiya2.Server.Models;

namespace Hiya2.Server.Repositories.Review
{
    public interface IReviewRepository
    {
        Task<(List<Models.Review> Reviews, double AverageRating, int TotalCount)> GetByProductAsync(int productId);
        Task<Models.Review> AddAsync(long customerId, int productId, int rating, string reviewText);
        Task<List<Models.Review>> GetAllForAdminAsync();
        Task<bool> DeleteAsync(long reviewId);
        Task<bool> SetActiveAsync(long reviewId, bool isActive);
    }
}
