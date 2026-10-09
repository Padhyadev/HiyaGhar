using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using Hiya2.Server.Models;
using Hiya2.Server.Seo;

namespace Hiya2.Server.Tests;

public class SeoMarkupTests
{
    private const string NastyName = "Tom's \"Best\" & </script><b>Bliss</b> <!--x-->";

    private static SeoConfig Config() => new()
    {
        SiteUrl = "https://hiyaghar.com",
        SiteName = "HIYAGHAR",
        Locale = "en_IN",
        ProductDescriptionTemplate = "Buy {name} from the HIYAGHAR {category}collection, handcrafted in small batches. See price, available sizes and stock, and order online.",
        Organization = new SeoOrganization { Name = "HIYAGHAR", Logo = "/image/HIYA LOGO (1).png", SameAs = new() { "https://www.instagram.com/hiyaghar_/" } },
    };

    private static Product NastyProduct() => new()
    {
        Id = 42,
        ProductName = NastyName,
        CategoryId = 1,
        Category = new Category { Id = 1, CategoryName = "Mukhwas & </script>" },
        ShortDescription = null,
        FullDescription = "<!--HIYA_META: {\"a\":1}--> <p>Short & sweet</p>",
        MainImagePath = "/uploads/product/a b.webp",
        Rating = 5.0m,
        ReviewCount = 0,
        Variants = new List<ProductVariant>
        {
            new() { Id = 1, SKU = "SKU-1", VariantName = "Weight: 100 g", Price = 60m, AvailableStock = 0, ReservedStock = 0, IsDefault = true },
            new() { Id = 2, SKU = "SKU-2", VariantName = "Weight: 200 g", Price = 120m, AvailableStock = 5, ReservedStock = 1 },
        },
    };

    private static (string Head, JsonElement Graph) RenderProduct()
    {
        var c = Config();
        var p = NastyProduct();
        var description = SeoMarkup.ProductDescription(p, c.ProductDescriptionTemplate);
        var images = SeoMarkup.ProductImages(c, p, "/image/HIYA LOGO (1).png");
        var page = new SeoPage
        {
            Title = $"{p.ProductName} | HIYAGHAR",
            Description = description,
            Path = "/product/42",
            Image = images[0],
            OgType = "product",
            JsonLd = new List<object> { SeoMarkup.Organization(c), SeoMarkup.ProductNode(c, p, description, images) },
        };
        var head = SeoMarkup.BuildHead(page, c);
        var json = Regex.Match(head, "<script type=\"application/ld\\+json\"[^>]*>(.*?)</script>", RegexOptions.Singleline).Groups[1].Value;
        return (head, JsonDocument.Parse(json).RootElement.GetProperty("@graph"));
    }

    [Fact]
    public void Special_characters_cannot_break_out_of_tags()
    {
        var (head, _) = RenderProduct();

        // Only our own JSON-LD script closes; the name's "</script>" and "<b>" are escaped everywhere.
        Assert.Single(Regex.Matches(head, "</script>", RegexOptions.IgnoreCase));
        Assert.DoesNotContain("<b>", head);
        Assert.DoesNotContain("<!--x-->", head);

        // Title round-trips exactly after HTML decoding.
        var title = Regex.Match(head, "<title[^>]*>(.*?)</title>").Groups[1].Value;
        Assert.Equal(NastyName + " | HIYAGHAR", WebUtility.HtmlDecode(title));

        // Attribute values stay inside their double quotes.
        var ogTitle = Regex.Match(head, "property=\"og:title\" content=\"([^\"]*)\"").Groups[1].Value;
        Assert.Equal(NastyName + " | HIYAGHAR", WebUtility.HtmlDecode(ogTitle));
    }

    [Fact]
    public void JsonLd_parses_and_contains_real_values_only()
    {
        var (head, graph) = RenderProduct();
        var product = graph.EnumerateArray().Single(n => n.GetProperty("@type").GetString() == "Product");

        Assert.Equal(NastyName, product.GetProperty("name").GetString());
        Assert.False(product.TryGetProperty("aggregateRating", out _));
        Assert.False(product.TryGetProperty("review", out _));
        Assert.DoesNotContain("null", head.Split("application/ld+json")[1]);

        var offers = product.GetProperty("offers").EnumerateArray().ToList();
        Assert.Equal(2, offers.Count);
        Assert.Equal(60m, offers[0].GetProperty("price").GetDecimal());
        Assert.Equal("https://schema.org/OutOfStock", offers[0].GetProperty("availability").GetString());
        Assert.Equal(120m, offers[1].GetProperty("price").GetDecimal());
        Assert.Equal("https://schema.org/InStock", offers[1].GetProperty("availability").GetString());
        Assert.Equal("INR", offers[1].GetProperty("priceCurrency").GetString());
        Assert.Equal("https://hiyaghar.com/uploads/product/a%20b.webp", product.GetProperty("image")[0].GetString());
    }

    [Fact]
    public void Product_description_strips_meta_and_html_and_stays_within_160()
    {
        var c = Config();
        var p = NastyProduct();
        var d = SeoMarkup.ProductDescription(p, c.ProductDescriptionTemplate);
        Assert.DoesNotContain("HIYA_META", d);
        Assert.DoesNotContain("<p>", d);
        Assert.StartsWith("Short & sweet Buy ", d);   // short real text gets the template appended
        Assert.InRange(d.Length, 120, 160);

        p.ShortDescription = new string('x', 50) + " " + string.Join(' ', Enumerable.Repeat("word", 60));
        var longD = SeoMarkup.ProductDescription(p, c.ProductDescriptionTemplate);
        Assert.True(longD.Length <= 160);
        Assert.EndsWith("…", longD);
    }

    [Fact]
    public void Inject_replaces_markers_and_urls_are_canonical()
    {
        var html = "<head><!--SEO_HEAD--><title data-static-head>x</title><!--/SEO_HEAD--></head><body><!--SEO_BODY--><!--/SEO_BODY--><div id=\"root\"></div></body>";
        var result = SeoMarkup.Inject(html, "<title>T</title>", "<noscript>B</noscript>");
        Assert.Equal("<head><title>T</title></head><body><noscript>B</noscript><div id=\"root\"></div></body>", result);

        Assert.Equal("https://hiyaghar.com/mukhwas", SeoMarkup.CanonicalUrl("https://hiyaghar.com", "/Mukhwas/?x=1"));
        Assert.Equal("https://hiyaghar.com/", SeoMarkup.CanonicalUrl("https://hiyaghar.com", "/"));
        Assert.Equal("https://hiyaghar.com/image/HIYA%20LOGO%20(1).png", SeoMarkup.AbsoluteUrl("https://hiyaghar.com", "/image/HIYA LOGO (1).png"));
    }
}
