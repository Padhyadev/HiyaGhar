using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;

namespace Hiya2.Server.Repositories.Category
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly DataContext _context;

        public CategoryRepository(DataContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Models.Category>> GetAllAsync()
        {
            return await _context.Categories
                .AsNoTracking()
                .Where(c => !c.IsDeleted)
                .ToListAsync();
        }

        public async Task<Models.Category?> GetByIdAsync(int id)
        {
            return await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
        }

        public async Task<Models.Category> AddAsync(Models.Category category)
        {
            category.CreatedDate = DateTime.Now;
            category.IsDeleted = false;
            await _context.Categories.AddAsync(category);
            await _context.SaveChangesAsync();
            return category;
        }

        public async Task<bool> UpdateAsync(Models.Category category)
        {
            var existing = await _context.Categories.FindAsync(category.Id);
            if (existing == null || existing.IsDeleted)
            {
                return false;
            }

            existing.CategoryName = category.CategoryName;
            existing.ParentCategoryId = category.ParentCategoryId;
            if (!string.IsNullOrEmpty(category.ImagePath))
            {
                existing.ImagePath = category.ImagePath;
            }
            existing.SKU = category.SKU;
            existing.Description = category.Description;
            existing.IsActive = category.IsActive;
            existing.LastModifiedBy = category.LastModifiedBy;
            existing.LastModifiedDate = DateTime.Now;

            _context.Categories.Update(existing);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null || category.IsDeleted)
            {
                return false;
            }

            category.IsActive = false;
            category.IsDeleted = true;
            category.LastModifiedDate = DateTime.Now;

            _context.Categories.Update(category);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
