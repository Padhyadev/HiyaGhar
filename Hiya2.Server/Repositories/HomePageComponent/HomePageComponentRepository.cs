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
            var existing = await _context.HomePageComponents
                .Include(c => c.Items.Where(i => !i.IsDeleted))
                .FirstOrDefaultAsync(c => c.Id == component.Id);
            if (existing == null || existing.IsDeleted)
            {
                return false;
            }

            var now = DateTime.Now;
            existing.Key = component.Key;
            existing.Name = component.Name;
            existing.Type = component.Type;
            existing.DisplayOrder = component.DisplayOrder;
            existing.IsActive = component.IsActive;
            existing.LastModifiedBy = component.LastModifiedBy;
            existing.LastModifiedDate = now;

            // Items (e.g. the Bestsellers product list in RefId) are saved with the component: the
            // admin form sends the full list, so update matching ids, add new ones (Id 0) and
            // soft-delete items that are no longer in the list.
            if (component.Items != null)
            {
                var incoming = component.Items.ToList();
                var incomingIds = incoming.Where(i => i.Id > 0).Select(i => i.Id).ToHashSet();

                foreach (var old in existing.Items.Where(i => !incomingIds.Contains(i.Id)))
                {
                    old.IsActive = false;
                    old.IsDeleted = true;
                    old.LastModifiedBy = component.LastModifiedBy;
                    old.LastModifiedDate = now;
                }

                foreach (var item in incoming)
                {
                    var target = item.Id > 0 ? existing.Items.FirstOrDefault(i => i.Id == item.Id) : null;
                    if (target == null)
                    {
                        existing.Items.Add(new HomePageComponentItem
                        {
                            Title = item.Title,
                            Subtitle = item.Subtitle,
                            Description = item.Description,
                            RefId = item.RefId,
                            RefType = item.RefType,
                            DisplayOrder = item.DisplayOrder,
                            IsActive = item.IsActive,
                            CreatedBy = component.LastModifiedBy is > 0 ? component.LastModifiedBy.Value : 1,
                            CreatedDate = now,
                        });
                        continue;
                    }

                    target.Title = item.Title;
                    target.Subtitle = item.Subtitle;
                    target.Description = item.Description;
                    target.RefId = item.RefId;
                    target.RefType = item.RefType;
                    target.DisplayOrder = item.DisplayOrder;
                    target.IsActive = item.IsActive;
                    target.LastModifiedBy = component.LastModifiedBy;
                    target.LastModifiedDate = now;
                }
            }

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
