using Hiya2.Server.Models;

namespace Hiya2.Server.Repositories.Wishlist
{
    public class WishlistLine
    {
        public WishlistCustomer Item { get; set; } = null!;
        public Models.Product Product { get; set; } = null!;
        public ProductVariant? Variant { get; set; }
    }

    public interface IWishlistRepository
    {
        Task<List<WishlistLine>> GetWishlistAsync(long customerId);
        Task<bool> AddAsync(long customerId, int productId, int? variantId, string? packingType);
        Task<bool> RemoveAsync(long customerId, int productId, int? variantId, string? packingType);
        Task<int> MergeGuestWishlistAsync(long customerId, List<(int ProductId, int? VariantId, string? PackingType)> items);
    }
}
