using Hiya2.Server.Models;

namespace Hiya2.Server.Repositories.Category
{
    public interface ICategoryRepository
    {
        Task<IEnumerable<Models.Category>> GetAllAsync();
        Task<Models.Category?> GetByIdAsync(int id);
        Task<Models.Category> AddAsync(Models.Category category);
        Task<bool> UpdateAsync(Models.Category category);
        Task<bool> DeleteAsync(int id);
    }
}
