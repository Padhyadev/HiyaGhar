using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;

namespace Hiya2.Server.Repositories.HomePageComponent
{
    public class HomePageComponentRepository : IHomePageComponentRepository
    {
        private readonly DataContext _context;

        public HomePageComponentRepository(DataContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Models.HomePageComponent>> GetAllAsync()
        {
            return await _context.HomePageComponents
                .AsNoTracking()
                .Include(c => c.Items.Where(i => !i.IsDeleted))
                .Where(c => !c.IsDeleted)
                .OrderBy(c => c.DisplayOrder)
                .ToListAsync();
        }

        public async Task<Models.HomePageComponent?> GetByKeyAsync(string key)
        {
            return await _context.HomePageComponents
                .Include(c => c.Items.Where(i => !i.IsDeleted && i.IsActive))
                .FirstOrDefaultAsync(c => c.Key.ToLower() == key.ToLower() && !c.IsDeleted && c.IsActive);
        }

        public async Task<Models.HomePageComponent?> GetByIdAsync(int id)
        {
            return await _context.HomePageComponents
                .Include(c => c.Items.Where(i => !i.IsDeleted))
                .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
        }

        public async Task<Models.HomePageComponent> AddAsync(Models.HomePageComponent component)
        {
            component.CreatedDate = DateTime.Now;
            component.IsDeleted = false;

            if (component.Items != null)
            {
                foreach (var item in component.Items)
                {
                    item.CreatedDate = DateTime.Now;
                    item.IsDeleted = false;
                    if (item.CreatedBy <= 0)
                    {
                        item.CreatedBy = 1;
                    }
                }
            }

            await _context.HomePageComponents.AddAsync(component);
            await _context.SaveChangesAsync();
            return component;
        }

        public async Task<bool> UpdateAsync(Models.HomePageComponent component)
        {
            var existing = await _context.HomePageComponents.FindAsync(component.Id);
            if (existing == null || existing.IsDeleted)
            {
                return false;
            }

            existing.Key = component.Key;
            existing.Name = component.Name;
            existing.Type = component.Type;
            existing.DisplayOrder = component.DisplayOrder;
            existing.IsActive = component.IsActive;
            existing.LastModifiedBy = component.LastModifiedBy;
            existing.LastModifiedDate = DateTime.Now;

            _context.HomePageComponents.Update(existing);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var component = await _context.HomePageComponents.FindAsync(id);
            if (component == null || component.IsDeleted)
            {
                return false;
            }

            component.IsActive = false;
            component.IsDeleted = true;
            component.LastModifiedDate = DateTime.Now;

            _context.HomePageComponents.Update(component);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AddItemAsync(HomePageComponentItem item)
        {
            item.CreatedDate = DateTime.Now;
            item.IsDeleted = false;

            await _context.HomePageComponentItems.AddAsync(item);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteItemAsync(int itemId)
        {
            var item = await _context.HomePageComponentItems.FindAsync(itemId);
            if (item == null || item.IsDeleted)
            {
                return false;
            }

            item.IsActive = false;
            item.IsDeleted = true;
            item.LastModifiedDate = DateTime.Now;

            _context.HomePageComponentItems.Update(item);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
