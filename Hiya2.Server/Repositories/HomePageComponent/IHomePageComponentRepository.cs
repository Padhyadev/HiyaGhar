using Hiya2.Server.Models;

namespace Hiya2.Server.Repositories.HomePageComponent
{
    public interface IHomePageComponentRepository
    {
        Task<IEnumerable<Models.HomePageComponent>> GetAllAsync();
        Task<Models.HomePageComponent?> GetByKeyAsync(string key);
        Task<Models.HomePageComponent?> GetByIdAsync(int id);
        Task<Models.HomePageComponent> AddAsync(Models.HomePageComponent component);
        Task<bool> UpdateAsync(Models.HomePageComponent component);
        Task<bool> DeleteAsync(int id);
        Task<bool> AddItemAsync(HomePageComponentItem item);
        Task<bool> DeleteItemAsync(int itemId);
    }
}
