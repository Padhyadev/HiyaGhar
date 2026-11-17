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
        Organization = new SeoOrganization { Name = "HIYAGHAR", Logo = "/image/HiyaGhar.webp", SameAs = new() { "https://www.instagram.com/hiyaghar_/" } },
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
        var images = SeoMarkup.ProductImages(c, p, "/image/HiyaGhar.webp");
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
        var html = "<head><!--SEO_HEAD--><title data-static-head>x</title><!--/SEO_HEAD--></head><body><div id=\"root\"><!--SEO_BODY--><!--/SEO_BODY--></div></body>";
        var result = SeoMarkup.Inject(html, "<title>T</title>", SeoMarkup.Prerender("B"));
        Assert.Equal("<head><title>T</title></head><body><div id=\"root\"><div data-server-seo=\"1\" class=\"seo-prerender\">B</div></div></body>", result);

        Assert.Equal("https://hiyaghar.com/mukhwas", SeoMarkup.CanonicalUrl("https://hiyaghar.com", "/Mukhwas/?x=1"));
        Assert.Equal("https://hiyaghar.com/", SeoMarkup.CanonicalUrl("https://hiyaghar.com", "/"));
        Assert.Equal("https://hiyaghar.com/image/HiyaGhar.webp", SeoMarkup.AbsoluteUrl("https://hiyaghar.com", "/image/HiyaGhar.webp"));
    }

    [Theory]
    [InlineData("Beet Radiance Beetroot Soap", "beet-radiance-beetroot-soap")]
    [InlineData("Beet Radiance - Beetroot Soap", "beet-radiance-beetroot-soap")]
    [InlineData("  Hing Hajma (100g) & Jeera_Goli ", "hing-hajma-100g-jeeragoli")]
    [InlineData("मुखवास", "")]
    public void Product_slug_matches_client_rule(string name, string expected)
    {
        Assert.Equal(expected, SeoMarkup.ProductSlug(name));
    }

    [Fact]
    public void Product_paths_keep_slug_for_lowest_id_and_fall_back_to_id()
    {
        var paths = SeoMarkup.ProductPaths(new (int, string?)[] { (7, "Tea Masala"), (3, "Tea  Masala"), (9, "मुखवास") });
        Assert.Equal("/product/tea-masala", paths[3]);
        Assert.Equal("/product/7", paths[7]);
        Assert.Equal("/product/9", paths[9]);
    }

    [Fact]
    public void Product_meta_reads_saved_ingredients_only()
    {
        var meta = SeoMarkup.ProductMeta("Text <!--HIYA_META: {\"ingredients\":[\"Fennel\",\"<b>Sugar</b>\",\"\"],\"benefits\":[\"Aids digestion\"],"
            + "\"shelfLife\":\" 6 months \",\"howToUse\":\"After meals\",\"faqs\":[{\"question\":\"Vegan?\",\"answer\":\"Yes\"},{\"question\":\"No answer\",\"answer\":\"\"},5]} -->");
        Assert.Equal(new[] { "Fennel", "Sugar" }, meta.Ingredients);
        Assert.Equal(new[] { "Aids digestion" }, meta.Benefits);
        Assert.Equal("6 months", meta.ShelfLife);
        Assert.Equal("After meals", meta.HowToUse);
        Assert.Equal(new[] { ("Vegan?", "Yes") }, meta.Faqs);

        var faqNode = JsonDocument.Parse(SeoMarkup.SerializeJsonLd(new[] { SeoMarkup.ProductFaqNode(Config(), "/product/fennel", meta.Faqs) }))
            .RootElement.GetProperty("@graph")[0];
        Assert.Equal("FAQPage", faqNode.GetProperty("@type").GetString());
        Assert.Equal("Yes", faqNode.GetProperty("mainEntity")[0].GetProperty("acceptedAnswer").GetProperty("text").GetString());

        Assert.Empty(SeoMarkup.ProductMeta("no meta").Ingredients);
        Assert.Empty(SeoMarkup.ProductMeta("<!--HIYA_META: {broken -->").Ingredients);
        Assert.Empty(SeoMarkup.ProductMeta("<!--HIYA_META: [1,2] -->").Benefits);
    }

    [Fact]
    public void Store_and_founder_nodes_use_config_values()
    {
        var c = Config();
        c.Organization.StreetAddress = "303, APM Mall Complex, Ghatlodiya";
        c.Organization.PostalCode = "380061";
        c.Organization.OpeningHours = new() { "Mo-Sa 10:00-19:00" };
        c.Organization.Founder = new SeoPerson { Name = "Priti Shah", JobTitle = "Founder", Image = "/image/founder-priti-shah.webp" };

        var graph = JsonDocument.Parse(SeoMarkup.SerializeJsonLd(new[] { SeoMarkup.Organization(c), SeoMarkup.LocalBusiness(c) }))
            .RootElement.GetProperty("@graph").EnumerateArray().ToList();
        var org = graph.Single(n => n.GetProperty("@type").GetString() == "Organization");
        var store = graph.Single(n => n.GetProperty("@type").GetString() == "Store");

        Assert.Equal("380061", store.GetProperty("address").GetProperty("postalCode").GetString());
        Assert.Equal("Mo-Sa 10:00-19:00", store.GetProperty("openingHours")[0].GetString());
        Assert.Equal("https://hiyaghar.com/#organization", store.GetProperty("parentOrganization").GetProperty("@id").GetString());
        Assert.Equal("Priti Shah", org.GetProperty("founder").GetProperty("name").GetString());
        Assert.Equal("https://hiyaghar.com/#founder", org.GetProperty("founder").GetProperty("@id").GetString());

        // No founder configured: no founder property at all (not null).
        c.Organization.Founder = null;
        var orgOnly = JsonDocument.Parse(SeoMarkup.SerializeJsonLd(new[] { SeoMarkup.Organization(c) })).RootElement.GetProperty("@graph")[0];
        Assert.False(orgOnly.TryGetProperty("founder", out _));
    }

    [Theory]
    [InlineData("Choco Masti", "Mukhwas", "Choco Masti Mukhwas | HIYAGHAR")]
    [InlineData("Neem Aloe Fresh", "Handmade Soap", "Neem Aloe Fresh Handmade Soap | HIYAGHAR")]
    [InlineData("Glow Craft Detan Soap", "Handmade Soap", "Glow Craft Detan Soap | HIYAGHAR")]
    [InlineData("Keshvedaam Herbal Hair Oil", "Hair Oil", "Keshvedaam Herbal Hair Oil | HIYAGHAR")]
    [InlineData("Tea Masala", "Tea Masala", "Tea Masala | HIYAGHAR")]
    [InlineData("Neem Aloe Fresh Soap 3-Pack Combo", "Combos", "Neem Aloe Fresh Soap 3-Pack Combo | HIYAGHAR")]
    [InlineData("Choco Masti", null, "Choco Masti | HIYAGHAR")]
    public void Product_title_adds_the_category_unless_the_name_already_says_it(string name, string? category, string expected)
    {
        Assert.Equal(expected, SeoMarkup.ProductTitle(name, category, "HIYAGHAR"));
    }

    [Fact]
    public void Category_guide_is_empty_until_text_is_added_and_then_matches_its_faq_node()
    {
        Assert.Equal("", SeoMarkup.GuideSection(null));
        Assert.Equal("", SeoMarkup.GuideSection(new SeoGuide { Heading = "About", Paragraphs = new() { " " }, Faqs = new() { new SeoQuestion { Question = "Q?", Answer = "" } } }));

        var guide = new SeoGuide
        {
            Heading = "About mukhwas",
            Paragraphs = new() { "Para <one>" },
            Faqs = new() { new SeoQuestion { Question = "Is it sweet?", Answer = "Yes & crunchy." } },
        };
        var html = SeoMarkup.GuideSection(guide);
        Assert.Equal("<section><h2>About mukhwas</h2><p>Para &lt;one&gt;</p><h2>Frequently Asked Questions</h2><h3>Is it sweet?</h3><p>Yes &amp; crunchy.</p></section>", html);

        var node = JsonDocument.Parse(SeoMarkup.SerializeJsonLd(new[] { SeoMarkup.FaqPageNode(Config(), "/mukhwas", SeoMarkup.GuideContent(guide).Faqs) }))
            .RootElement.GetProperty("@graph")[0];
        Assert.Equal("FAQPage", node.GetProperty("@type").GetString());
        Assert.Equal("Is it sweet?", node.GetProperty("mainEntity")[0].GetProperty("name").GetString());
        Assert.Equal("Yes & crunchy.", node.GetProperty("mainEntity")[0].GetProperty("acceptedAnswer").GetProperty("text").GetString());
    }

    [Fact]
    public void Organization_and_website_carry_the_alternate_brand_name()
    {
        var c = Config();
        c.Organization.AlternateName = "HIYA Ghar";
        var graph = JsonDocument.Parse(SeoMarkup.SerializeJsonLd(new[] { SeoMarkup.Organization(c), SeoMarkup.WebSite(c) }))
            .RootElement.GetProperty("@graph").EnumerateArray().ToList();

        Assert.All(graph, n => Assert.Equal("HIYA Ghar", n.GetProperty("alternateName").GetString()));

        // Not configured: the property is left out (no null / empty value).
        c.Organization.AlternateName = null;
        var plain = JsonDocument.Parse(SeoMarkup.SerializeJsonLd(new[] { SeoMarkup.Organization(c) })).RootElement.GetProperty("@graph")[0];
        Assert.False(plain.TryGetProperty("alternateName", out _));
    }

    [Fact]
    public void Faqs_are_grouped_in_config_order_with_unknown_categories_last()
    {
        var categories = new List<SeoFaqCategory>
        {
            new() { Key = "general", Heading = "About HIYAGHAR", Related = new() { new SeoLink { Text = "Our Story", Path = "/our-story" } } },
            new() { Key = "orders", Heading = "Orders & Shipping" },
            new() { Key = "gifting", Heading = "Gifting & Combos" }, // no FAQs: left out
        };
        var faqs = new (string?, string, string)[]
        {
            ("orders", "Q-order-1", "A1"),
            ("misc", "Q-other", "A2"),
            ("General", "Q-general", "A3"), // category match ignores case
            ("orders", "Q-order-2", "A4"),
        };

        var groups = SeoMarkup.GroupFaqs(categories, faqs);

        Assert.Equal(new[] { "About HIYAGHAR", "Orders & Shipping", "More Questions" }, groups.Select(g => g.Heading));
        Assert.Equal(new[] { "Q-order-1", "Q-order-2" }, groups[1].Faqs.Select(f => f.Question)); // keeps DB order
        Assert.Equal(4, groups.Sum(g => g.Faqs.Count)); // nothing dropped
    }

    [Fact]
    public void Faq_sections_render_question_headings_answers_and_related_links_encoded()
    {
        var groups = new List<SeoMarkup.FaqGroup>
        {
            new("Orders & Shipping", new() { new SeoLink { Text = "Shipping Policy", Path = "/shipping-policy" } },
                new() { (NastyName, "Answer <b>here</b>") }),
        };

        var html = SeoMarkup.FaqSections(groups);

        Assert.StartsWith("<section><h2>Orders &amp; Shipping</h2><h3>", html);
        Assert.Contains("<p>Answer &lt;b&gt;here&lt;/b&gt;</p>", html);
        Assert.Contains("<p>Related: <a href=\"/shipping-policy\">Shipping Policy</a></p>", html);
        Assert.DoesNotContain("</script>", html);
        Assert.EndsWith("</section>", html);
    }
}
