using System.Xml.Linq;
using Hiya2.Server.Models;
using Hiya2.Server.Seo;

namespace Hiya2.Server.Tests;

public class MerchantFeedTests
{
    private static readonly XNamespace G = "http://base.google.com/ns/1.0";

    private static SeoConfig Config() => new() { SiteUrl = "https://hiyaghar.com", SiteName = "HIYAGHAR", ProductDescriptionTemplate = "Buy {name}." };

    // Like Drakshawati: photos only on the Bottle variants.
    private static Product Drakshawati() => new()
    {
        Id = 13,
        ProductName = "Drakshawati",
        IsActive = true,
        Category = new Category { CategoryName = "Mukhwas" },
        FullDescription = "Raisin mukhwas & more <!--HIYA_META: {\"ingredients\":[\"Raisins\"]} -->",
        MainImagePath = "/uploads/product/bottle150.png",
        Variants = new List<ProductVariant>
        {
            new() { Id = 320, VariantName = "Weight: 150 g, Packing: Pouch", Price = 70m, AvailableStock = 10 },
            new() { Id = 321, VariantName = "Weight: 150 g, Packing: Bottle", Price = 90m, OriginalPrice = 120m, AvailableStock = 3, ReservedStock = 3, IsDefault = true, SKU = "DRK-150-B" },
        },
        Images = new List<ProductImage>
        {
            new() { Id = 1, VariantId = 321, ImagePath = "/uploads/product/bottle150.png", IsPrimary = true },
        },
    };

    private static List<XElement> Items(params Product[] products) =>
        XDocument.Parse(MerchantFeed.Build(products, Config(), new Dictionary<int, string> { [13] = "/product/drakshawati" }))
            .Descendants("item").ToList();

    [Fact]
    public void Variant_without_own_photo_is_left_out_when_other_variants_have_photos()
    {
        var item = Assert.Single(Items(Drakshawati()));
        Assert.Equal("13-321", item.Element(G + "id")!.Value);
        Assert.Equal("Drakshawati - 150 g, Bottle", item.Element(G + "title")!.Value);
        Assert.Equal("https://hiyaghar.com/uploads/product/bottle150.png", item.Element(G + "image_link")!.Value);
        Assert.Equal("https://hiyaghar.com/product/drakshawati", item.Element(G + "link")!.Value);
    }

    [Fact]
    public void Prices_stock_and_identifiers_are_real_values()
    {
        var item = Assert.Single(Items(Drakshawati()));
        Assert.Equal("120.00 INR", item.Element(G + "price")!.Value);
        Assert.Equal("90.00 INR", item.Element(G + "sale_price")!.Value);
        Assert.Equal("out_of_stock", item.Element(G + "availability")!.Value);   // 3 available - 3 reserved
        Assert.Equal("no", item.Element(G + "identifier_exists")!.Value);
        Assert.Equal("DRK-150-B", item.Element(G + "mpn")!.Value);
        Assert.Equal("13", item.Element(G + "item_group_id")!.Value);
        Assert.Equal("Raisin mukhwas & more", item.Element(G + "description")!.Value);
    }

    [Fact]
    public void Common_photo_is_used_and_products_without_variants_or_inactive_are_skipped()
    {
        var p = Drakshawati();
        p.Images.Add(new ProductImage { Id = 2, VariantId = null, ImagePath = "/uploads/product/common.png" });
        var noVariants = new Product { Id = 50, ProductName = "Loose", IsActive = true, MainImagePath = "/x.png" };
        var inactive = Drakshawati();
        inactive.Id = 51;
        inactive.IsActive = false;

        // Both Drakshawati variants (Pouch now uses the common photo); the other two products are skipped.
        var items = Items(p, noVariants, inactive);
        Assert.Equal(new[] { "13-321", "13-320" }, items.Select(i => i.Element(G + "id")!.Value));   // default variant first
        Assert.Equal("https://hiyaghar.com/uploads/product/common.png", items[1].Element(G + "image_link")!.Value);
    }

    [Theory]
    [InlineData("Wedding", "Wedding Gift Hampers | HIYAGHAR")]
    [InlineData("Corporate Gifts", "Corporate Gifts | HIYAGHAR")]
    [InlineData(" Diwali Hamper ", "Diwali Hamper | HIYAGHAR")]
    public void Occasion_title(string name, string expected) =>
        Assert.Equal(expected, SeoMarkup.OccasionTitle(name, "HIYAGHAR"));

    [Fact]
    public void Occasion_description_and_path()
    {
        Assert.StartsWith("Shop HIYAGHAR Wedding gift hampers", SeoMarkup.OccasionDescription("Wedding", "  "));
        Assert.Equal("Gifts for the couple", SeoMarkup.OccasionDescription("Wedding", "Gifts for <b>the</b> couple"));
        Assert.True(SeoMarkup.OccasionDescription("W", string.Join(' ', Enumerable.Repeat("word", 60))).Length <= 160);
        Assert.Equal("/gift-hampers/wedding", SeoMarkup.OccasionPath(" Wedding "));
    }
}
