using HIyaghar.Infra;
using Hiya2.Server.Models;
using Hiya2.Server.Repositories.HomePageComponent;
using Microsoft.EntityFrameworkCore;

namespace Hiya2.Server.Tests;

public class HomePageComponentRepositoryTests
{
    private static DbContextOptions<DataContext> NewOptions() =>
        new DbContextOptionsBuilder<DataContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;

    private static async Task<(int ComponentId, int ItemId)> SeedBestsellers(DbContextOptions<DataContext> options)
    {
        using var db = new DataContext(options);
        var component = new HomePageComponent
        {
            Key = "Bestsellers",
            Name = "Bestsellers",
            Type = "Carousel",
            IsActive = true,
            Items = new List<HomePageComponentItem>
            {
                // Drakshawati (13), Paan Pop (19), Hing Hajma (22) - product-variant pairs.
                new() { RefType = "Product", RefId = "13-320,19-182,22-220", DisplayOrder = 1, IsActive = true },
            },
        };
        db.HomePageComponents.Add(component);
        await db.SaveChangesAsync();
        return (component.Id, component.Items.Single().Id);
    }

    [Fact]
    public async Task Update_saves_changed_product_list_in_items()
    {
        var options = NewOptions();
        var (componentId, itemId) = await SeedBestsellers(options);

        // Admin removes Drakshawati and adds product 5 (the form sends the full component + items).
        using (var db = new DataContext(options))
        {
            var ok = await new HomePageComponentRepository(db).UpdateAsync(new HomePageComponent
            {
                Id = componentId,
                Key = "Bestsellers",
                Name = "Bestsellers",
                Type = "Carousel",
                IsActive = true,
                LastModifiedBy = 2,
                Items = new List<HomePageComponentItem>
                {
                    new() { Id = itemId, ComponentId = componentId, RefType = "Product", RefId = "19-182,22-220,5", DisplayOrder = 1, IsActive = true },
                },
            });
            Assert.True(ok);
        }

        using (var db = new DataContext(options))
        {
            var saved = await new HomePageComponentRepository(db).GetByKeyAsync("Bestsellers");
            var item = Assert.Single(saved!.Items);
            Assert.Equal(itemId, item.Id);
            Assert.Equal("19-182,22-220,5", item.RefId);
        }
    }

    [Fact]
    public async Task Update_adds_new_items_and_soft_deletes_removed_ones()
    {
        var options = NewOptions();
        var (componentId, itemId) = await SeedBestsellers(options);

        using (var db = new DataContext(options))
        {
            await new HomePageComponentRepository(db).UpdateAsync(new HomePageComponent
            {
                Id = componentId,
                Key = "Bestsellers",
                Name = "Bestsellers",
                Type = "Carousel",
                IsActive = true,
                Items = new List<HomePageComponentItem>
                {
                    new() { Id = 0, RefType = "Category", RefId = "1,2", DisplayOrder = 1, IsActive = true },
                },
            });
        }

        using (var db = new DataContext(options))
        {
            var all = await db.HomePageComponentItems.AsNoTracking().Where(i => i.ComponentId == componentId).ToListAsync();
            Assert.Equal(2, all.Count);
            Assert.True(all.Single(i => i.Id == itemId).IsDeleted);
            var added = all.Single(i => i.Id != itemId);
            Assert.False(added.IsDeleted);
            Assert.Equal("1,2", added.RefId);

            var visible = await new HomePageComponentRepository(db).GetByKeyAsync("Bestsellers");
            Assert.Equal("1,2", Assert.Single(visible!.Items).RefId);
        }
    }

    [Fact]
    public async Task Update_without_items_keeps_existing_items()
    {
        var options = NewOptions();
        var (componentId, _) = await SeedBestsellers(options);

        using (var db = new DataContext(options))
        {
            await new HomePageComponentRepository(db).UpdateAsync(new HomePageComponent
            {
                Id = componentId, Key = "Bestsellers", Name = "Renamed", Type = "Carousel", IsActive = true, Items = null!,
            });
        }

        using (var db = new DataContext(options))
        {
            var saved = await new HomePageComponentRepository(db).GetByKeyAsync("Bestsellers");
            Assert.Equal("Renamed", saved!.Name);
            Assert.Equal("13-320,19-182,22-220", Assert.Single(saved.Items).RefId);
        }
    }
}
