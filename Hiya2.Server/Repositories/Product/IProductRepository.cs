using Hiya2.Server.Models;

namespace Hiya2.Server.Repositories.Product
{
    public interface IProductRepository
    {
        Task<IEnumerable<Models.Product>> GetAllAsync(int? categoryId = null, bool? isFeatured = null, bool? onlyActive = null);
        Task<Models.Product?> GetByIdAsync(int id);
        Task<Models.Product> AddAsync(Models.Product product);
        Task<bool> UpdateAsync(Models.Product product);
        Task<bool> DeleteAsync(int id);
        Task<bool> AddVariantAsync(ProductVariant variant);
        Task<bool> DeleteVariantAsync(int variantId);
        Task<bool> AddImageAsync(ProductImage image);
        Task<bool> DeleteImageAsync(int imageId);
    }
}
