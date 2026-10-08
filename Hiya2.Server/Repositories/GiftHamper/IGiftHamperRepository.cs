using Hiya2.Server.Models;

namespace Hiya2.Server.Repositories.GiftHamper
{
    public interface IGiftHamperRepository
    {
        Task<List<GiftHamperOccasion>> GetAllOccasionsAsync(bool onlyActive);
        Task<GiftHamperOccasion?> GetByIdAsync(int id);
        Task<GiftHamperOccasion?> GetBySlugAsync(string slug);
        Task<GiftHamperOccasion> AddAsync(GiftHamperOccasion occasion);
        Task<bool> UpdateAsync(GiftHamperOccasion occasion);
        Task<bool> DeleteAsync(int id);
        Task<bool> SetProductsAsync(int occasionId, List<int> productIds);
    }
}
