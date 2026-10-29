using HIyaghar.Infra;
using Hiya2.Server.Models;
using Hiya2.Server.Services;
using Microsoft.EntityFrameworkCore;

namespace Hiya2.Server.Tests;

public class ComboPricingTests
{
    private const string Meta = "A trio <!--HIYA_META: {\"comboItems\":[" +
        "{\"productId\":13,\"variantId\":321,\"quantity\":2,\"name\":\"Drakshawati\",\"variant\":\"150 g, Bottle\"}," +
        "{\"productId\":22,\"variantId\":221,\"quantity\":1,\"name\":\"Hing Hajma\",\"variant\":\"\"}]} -->";

    [Fact]
    public void Parses_items_and_skips_invalid_rows()
    {
        var items = ComboPricing.ParseItems(Meta.Replace("]} -->", ",{\"productId\":0,\"variantId\":1,\"quantity\":1},5]} -->"));
        Assert.Equal(2, items.Count);
        Assert.Equal(new ComboItemRef(13, 321, 2, "Drakshawati", "150 g, Bottle"), items[0]);
        Assert.Empty(ComboPricing.ParseItems("plain product"));
        Assert.Empty(ComboPricing.ParseItems("<!--HIYA_META: {broken -->"));
    }

    [Fact]
    public void Total_is_quantity_times_current_price_and_null_when_an_item_is_gone()
    {
        var items = ComboPricing.ParseItems(Meta);
        Assert.Equal(2 * 45m + 35m, ComboPricing.Total(items, new Dictionary<int, decimal> { [321] = 45m, [221] = 35m }));
        Assert.Null(ComboPricing.Total(items, new Dictionary<int, decimal> { [321] = 45m }));
    }

    [Fact]
    public async Task Recalculate_updates_original_price_but_never_the_combo_price()
    {
        var options = new DbContextOptionsBuilder<DataContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        using (var db = new DataContext(options))
        {
            var mukhwas = new Category { Id = 1, CategoryName = "Mukhwas" };
            var combos = new Category { Id = 9, CategoryName = ComboPricing.CategoryName };
            db.Categories.AddRange(mukhwas, combos);
            db.Products.AddRange(
                new Product { Id = 13, ProductName = "Drakshawati", Category = mukhwas, Variants = { new ProductVariant { Id = 321, VariantName = "150 g", Price = 50m } } },
                new Product { Id = 22, ProductName = "Hing Hajma", Category = mukhwas, Variants = { new ProductVariant { Id = 221, VariantName = "No Variant", Price = 35m } } },
                new Product
                {
                    Id = 40, ProductName = "Trio", Category = combos, FullDescription = Meta, BasePrice = 125m,
                    Variants = { new ProductVariant { Id = 400, VariantName = "No Variant", Price = 120m, OriginalPrice = 125m } },
                });
            await db.SaveChangesAsync();

            Assert.Equal(1, await ComboPricing.RecalculateAsync(db));
        }

        using (var db = new DataContext(options))
        {
            var v = await db.ProductVariants.SingleAsync(x => x.Id == 400);
            Assert.Equal(135m, v.OriginalPrice);   // 2 x 50 + 35 with the new Drakshawati price
            Assert.Equal(120m, v.Price);           // the admin's combo price is untouched
            Assert.Equal(135m, (await db.Products.SingleAsync(x => x.Id == 40)).BasePrice);
        }
    }
}
