using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;

namespace Hiya2.Server.Repositories.GiftHamper
{
    public class GiftHamperRepository : IGiftHamperRepository
    {
        private readonly DataContext _context;

        public GiftHamperRepository(DataContext context)
        {
            _context = context;
        }

        private IQueryable<GiftHamperOccasion> BaseQuery()
        {
            return _context.GiftHamperOccasions
                .Where(o => !o.IsDeleted)
                .Include(o => o.Products.Where(p => !p.IsDeleted && p.IsActive))
                    .ThenInclude(p => p.Product!)
                        .ThenInclude(prod => prod.Variants.Where(v => !v.IsDeleted))
                .Include(o => o.Products.Where(p => !p.IsDeleted && p.IsActive))
                    .ThenInclude(p => p.Product!)
                        .ThenInclude(prod => prod.Images.Where(i => !i.IsDeleted));
        }

        public async Task<List<GiftHamperOccasion>> GetAllOccasionsAsync(bool onlyActive)
        {
            var query = BaseQuery();
            if (onlyActive)
            {
                query = query.Where(o => o.IsActive);
            }
            return await query
                .AsSplitQuery()
                .OrderBy(o => o.DisplayOrder)
                .ToListAsync();
        }

        public async Task<GiftHamperOccasion?> GetByIdAsync(int id)
        {
            return await BaseQuery().AsSplitQuery().FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<GiftHamperOccasion?> GetBySlugAsync(string slug)
        {
            var normalized = slug.Trim().ToLower();
            return await BaseQuery().AsSplitQuery().FirstOrDefaultAsync(o => o.Slug.ToLower() == normalized);
        }

        public async Task<GiftHamperOccasion> AddAsync(GiftHamperOccasion occasion)
        {
            occasion.Slug = occasion.Slug.Trim().ToLower();
            occasion.CreatedDate = DateTime.Now;
            occasion.IsDeleted = false;

            await _context.GiftHamperOccasions.AddAsync(occasion);
            await _context.SaveChangesAsync();
            return occasion;
        }

        public async Task<bool> UpdateAsync(GiftHamperOccasion occasion)
        {
            var existing = await _context.GiftHamperOccasions.FindAsync(occasion.Id);
            if (existing == null || existing.IsDeleted)
            {
                return false;
            }

            existing.Name = occasion.Name;
            existing.Slug = occasion.Slug.Trim().ToLower();
            existing.Description = occasion.Description;
            if (!string.IsNullOrEmpty(occasion.BannerImagePath))
            {
                existing.BannerImagePath = occasion.BannerImagePath;
            }
            existing.DisplayOrder = occasion.DisplayOrder;
            existing.IsActive = occasion.IsActive;
            existing.LastModifiedBy = occasion.LastModifiedBy;
            existing.LastModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var existing = await _context.GiftHamperOccasions.FindAsync(id);
            if (existing == null || existing.IsDeleted)
            {
                return false;
            }

            existing.IsActive = false;
            existing.IsDeleted = true;
            existing.LastModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SetProductsAsync(int occasionId, List<int> productIds)
        {
            var occasion = await _context.GiftHamperOccasions.FindAsync(occasionId);
            if (occasion == null || occasion.IsDeleted)
            {
                return false;
            }

            var existingLinks = await _context.GiftHamperOccasionProducts
                .Where(p => p.OccasionId == occasionId)
                .ToListAsync();

            var desiredIds = productIds.Distinct().ToList();

            // Soft-delete links no longer wanted.
            foreach (var link in existingLinks.Where(l => !l.IsDeleted && !desiredIds.Contains(l.ProductId)))
            {
                link.IsDeleted = true;
                link.IsActive = false;
            }

            // Reactivate previously-removed links that are wanted again.
            foreach (var link in existingLinks.Where(l => l.IsDeleted && desiredIds.Contains(l.ProductId)))
            {
                link.IsDeleted = false;
                link.IsActive = true;
            }

            // Add newly-wanted products that never had a row.
            var existingProductIds = existingLinks.Select(l => l.ProductId).ToHashSet();
            var order = 0;
            foreach (var productId in desiredIds)
            {
                if (!existingProductIds.Contains(productId))
                {
                    await _context.GiftHamperOccasionProducts.AddAsync(new GiftHamperOccasionProduct
                    {
                        OccasionId = occasionId,
                        ProductId = productId,
                        DisplayOrder = order,
                        IsActive = true,
                        IsDeleted = false,
                        CreatedDate = DateTime.Now
                    });
                }
                order++;
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
