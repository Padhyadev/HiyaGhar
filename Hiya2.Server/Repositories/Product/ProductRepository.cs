using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;

namespace Hiya2.Server.Repositories.Product
{
    public class ProductRepository : IProductRepository
    {
        private readonly DataContext _context;

        public ProductRepository(DataContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Models.Product>> GetAllAsync(int? categoryId = null, bool? isFeatured = null, bool? onlyActive = null)
        {
            var query = _context.Products
                .AsNoTracking()
                .Include(p => p.Category)
                .Include(p => p.Variants.Where(v => !v.IsDeleted))
                .Include(p => p.Images.Where(i => !i.IsDeleted))
                .Where(p => !p.IsDeleted);

            if (onlyActive.HasValue && onlyActive.Value)
            {
                query = query.Where(p => p.IsActive 
                    && !string.IsNullOrWhiteSpace(p.ProductName) 
                    && p.ProductName.Trim().ToLower() != "aasss" 
                    && p.ProductName.Trim().ToLower() != "sasas" 
                    && p.ProductName.Trim().ToLower() != "test"
                    && !string.IsNullOrWhiteSpace(p.MainImagePath)
                    && p.MainImagePath != "/uploads/Noimage.png");
            }

            if (categoryId.HasValue && categoryId.Value > 0)
            {
                query = query.Where(p => p.CategoryId == categoryId.Value);
            }

            if (isFeatured.HasValue)
            {
                query = query.Where(p => p.IsFeatured == isFeatured.Value);
            }

            return await query.ToListAsync();
        }

        public async Task<Models.Product?> GetByIdAsync(int id)
        {
            return await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Variants.Where(v => !v.IsDeleted))
                .Include(p => p.Images.Where(i => !i.IsDeleted))
                .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        }

        public async Task<Models.Product> AddAsync(Models.Product product)
        {
            product.CreatedDate = DateTime.Now;
            product.IsDeleted = false;

            await _context.Products.AddAsync(product);
            await _context.SaveChangesAsync();
            return product;
        }

        public async Task<bool> UpdateAsync(Models.Product product)
        {
            var existing = await _context.Products.FindAsync(product.Id);
            if (existing == null || existing.IsDeleted)
            {
                return false;
            }

            existing.CategoryId = product.CategoryId;
            existing.ProductName = product.ProductName;
            existing.ShortDescription = product.ShortDescription;
            existing.FullDescription = product.FullDescription;
            if (!string.IsNullOrEmpty(product.MainImagePath))
            {
                existing.MainImagePath = product.MainImagePath;
            }
            existing.BasePrice = product.BasePrice;
            existing.DiscountPrice = product.DiscountPrice;
            existing.Rating = product.Rating;
            existing.ReviewCount = product.ReviewCount;
            existing.IsFeatured = product.IsFeatured;
            existing.IsActive = product.IsActive;
            existing.LastModifiedBy = product.LastModifiedBy;
            existing.LastModifiedDate = DateTime.Now;

            _context.Products.Update(existing);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null || product.IsDeleted)
            {
                return false;
            }

            product.IsActive = false;
            product.IsDeleted = true;
            product.LastModifiedDate = DateTime.Now;

            _context.Products.Update(product);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AddVariantAsync(ProductVariant variant)
        {
            variant.CreatedDate = DateTime.Now;
            variant.IsDeleted = false;

            await _context.ProductVariants.AddAsync(variant);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteVariantAsync(int variantId)
        {
            var variant = await _context.ProductVariants.FindAsync(variantId);
            if (variant == null || variant.IsDeleted)
            {
                return false;
            }

            variant.IsActive = false;
            variant.IsDeleted = true;
            variant.LastModifiedDate = DateTime.Now;

            _context.ProductVariants.Update(variant);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AddImageAsync(ProductImage image)
        {
            image.CreatedDate = DateTime.Now;
            image.IsDeleted = false;

            await _context.ProductImages.AddAsync(image);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteImageAsync(int imageId)
        {
            var image = await _context.ProductImages.FindAsync(imageId);
            if (image == null || image.IsDeleted)
            {
                return false;
            }

            image.IsDeleted = true;
            _context.ProductImages.Update(image);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
