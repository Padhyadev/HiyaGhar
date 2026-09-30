using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;

namespace Hiya2.Server.Repositories.Wishlist
{
    public class WishlistRepository : IWishlistRepository
    {
        private readonly DataContext _context;

        public WishlistRepository(DataContext context)
        {
            _context = context;
        }

        public async Task<List<WishlistLine>> GetWishlistAsync(long customerId)
        {
            var items = await _context.WishlistCustomers
                .Where(w => w.CustomerId == customerId && !w.IsDeleted && w.IsActive)
                .Include(w => w.Product)
                .Include(w => w.Variant)
                .OrderByDescending(w => w.Id)
                .ToListAsync();

            var lines = new List<WishlistLine>();
            foreach (var item in items)
            {
                if (item.Product == null) continue;
                lines.Add(new WishlistLine { Item = item, Product = item.Product, Variant = item.Variant });
            }
            return lines;
        }

        public async Task<bool> AddAsync(long customerId, int productId, int? variantId, string? packingType)
        {
            var existing = await _context.WishlistCustomers.FirstOrDefaultAsync(w =>
                w.CustomerId == customerId &&
                w.ProductId == productId &&
                w.VariantId == variantId &&
                w.PackingType == packingType);

            if (existing != null)
            {
                if (existing.IsDeleted || !existing.IsActive)
                {
                    existing.IsDeleted = false;
                    existing.IsActive = true;
                    existing.LastModifiedDate = DateTime.Now;
                    await _context.SaveChangesAsync();
                }
                return true; // already in wishlist
            }

            await _context.WishlistCustomers.AddAsync(new WishlistCustomer
            {
                CustomerId = customerId,
                ProductId = productId,
                VariantId = variantId,
                PackingType = packingType,
                IsActive = true,
                IsDeleted = false,
                CreatedDate = DateTime.Now
            });
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveAsync(long customerId, int productId, int? variantId, string? packingType)
        {
            var existing = await _context.WishlistCustomers.FirstOrDefaultAsync(w =>
                w.CustomerId == customerId &&
                w.ProductId == productId &&
                w.VariantId == variantId &&
                w.PackingType == packingType &&
                !w.IsDeleted);

            if (existing == null) return false;

            existing.IsDeleted = true;
            existing.IsActive = false;
            existing.LastModifiedDate = DateTime.Now;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> MergeGuestWishlistAsync(long customerId, List<(int ProductId, int? VariantId, string? PackingType)> items)
        {
            int merged = 0;
            foreach (var line in items)
            {
                await AddAsync(customerId, line.ProductId, line.VariantId, line.PackingType);
                merged++;
            }
            return merged;
        }
    }
}
