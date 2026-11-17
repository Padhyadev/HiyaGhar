using System.Globalization;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Text.Unicode;
using Hiya2.Server.Models;

namespace Hiya2.Server.Seo
{
    /// <summary>What the server injects for one URL.</summary>
    public class SeoPage
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        /// <summary>Site-relative path used for canonical and og:url.</summary>
        public string Path { get; set; } = "/";
        /// <summary>Site-relative or absolute image URL.</summary>
        public string Image { get; set; } = string.Empty;
        public string OgType { get; set; } = "website";
        public bool Noindex { get; set; }
        public List<object> JsonLd { get; set; } = new();
        /// <summary>Already-encoded HTML for the pre-render block inside #root.</summary>
        public string BodyHtml { get; set; } = string.Empty;
    }

    /// <summary>Values the admin saved in a product's HIYA_META block. Empty when not entered.</summary>
    public record ProductMetaInfo(
        List<string> Ingredients,
        List<string> Benefits,
        string ShelfLife,
        string HowToUse,
        List<(string Question, string Answer)> Faqs);

    /// <summary>
    /// Pure markup builders (no I/O) so they can be unit-tested. All text is HTML-encoded; JSON-LD
    /// is produced by System.Text.Json whose encoder always escapes &lt; &gt; &amp; ' as < etc.,
    /// so data can never close the &lt;script&gt; element.
    /// </summary>
    public static class SeoMarkup
    {
        public const string HeadStart = "<!--SEO_HEAD-->";
        public const string HeadEnd = "<!--/SEO_HEAD-->";
        public const string BodyStart = "<!--SEO_BODY-->";
        public const string BodyEnd = "<!--/SEO_BODY-->";
        private const string Marker = " data-server-seo=\"1\"";

        private static readonly JsonSerializerOptions JsonLdOptions = new()
        {
            Encoder = JavaScriptEncoder.Create(UnicodeRanges.All),
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
        };

        private static readonly Regex HiyaMetaBlock = new(@"<!--HIYA_META[\s\S]*?-->", RegexOptions.Compiled);
        private static readonly Regex HtmlTag = new(@"<[^>]+>", RegexOptions.Compiled);
        private static readonly Regex Whitespace = new(@"\s+", RegexOptions.Compiled);

        public static string E(string? text) => System.Net.WebUtility.HtmlEncode(text ?? string.Empty);

        /// <summary>Same rule as the client (src/seo/routeSeo.ts): absolute URL, spaces encoded.</summary>
        public static string AbsoluteUrl(string siteUrl, string url)
        {
            if (url.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || url.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                return url;
            return siteUrl + (url.StartsWith('/') ? "" : "/") + url.Replace(" ", "%20");
        }

        /// <summary>https://hiyaghar.com + path, lower-case, no query, no trailing slash (root keeps "/").</summary>
        public static string CanonicalUrl(string siteUrl, string path)
        {
            var clean = (path ?? "/").Split('?', '#')[0].ToLowerInvariant();
            if (!clean.StartsWith('/')) clean = "/" + clean;
            if (clean.Length > 1) clean = clean.TrimEnd('/');
            return clean.Length <= 1 ? siteUrl + "/" : siteUrl + clean;
        }

        /// <summary>Head tags in the same order and with the same values as the client &lt;SEO&gt; component.</summary>
        public static string BuildHead(SeoPage page, SeoConfig config)
        {
            var url = CanonicalUrl(config.SiteUrl, page.Path);
            var image = AbsoluteUrl(config.SiteUrl, page.Image);
            var sb = new StringBuilder();
            sb.Append("<title").Append(Marker).Append('>').Append(E(page.Title)).Append("</title>\n");
            Meta(sb, "name", "description", page.Description);
            sb.Append("    <link").Append(Marker).Append(" rel=\"canonical\" href=\"").Append(E(url)).Append("\" />\n");
            Meta(sb, "name", "robots", page.Noindex ? "noindex,follow" : "index,follow");
            Meta(sb, "property", "og:site_name", config.SiteName);
            Meta(sb, "property", "og:type", page.OgType);
            Meta(sb, "property", "og:title", page.Title);
            Meta(sb, "property", "og:description", page.Description);
            Meta(sb, "property", "og:url", url);
            Meta(sb, "property", "og:image", image);
            Meta(sb, "property", "og:locale", config.Locale);
            Meta(sb, "name", "twitter:card", "summary_large_image");
            Meta(sb, "name", "twitter:title", page.Title);
            Meta(sb, "name", "twitter:description", page.Description);
            Meta(sb, "name", "twitter:image", image);
            if (page.JsonLd.Count > 0)
            {
                sb.Append("    ").Append(BuildJsonLdScript(page.JsonLd)).Append('\n');
            }
            return sb.ToString();
        }

        private static void Meta(StringBuilder sb, string attr, string key, string value)
        {
            sb.Append("    <meta").Append(Marker).Append(' ').Append(attr).Append("=\"").Append(E(key))
              .Append("\" content=\"").Append(E(value)).Append("\" />\n");
        }

        public static string SerializeJsonLd(IEnumerable<object> nodes)
        {
            var graph = new Dictionary<string, object?>
            {
                ["@context"] = "https://schema.org",
                ["@graph"] = nodes.ToList(),
            };
            return JsonSerializer.Serialize(WithoutNulls(graph), JsonLdOptions);
        }

        /// <summary>Drops null entries (and empty strings) from nested dictionaries/lists so the JSON-LD has no null values.</summary>
        private static object? WithoutNulls(object? value) => value switch
        {
            null => null,
            string s => s.Length == 0 ? null : s,
            IDictionary<string, object?> dict => dict
                .Select(kv => (kv.Key, Value: WithoutNulls(kv.Value)))
                .Where(kv => kv.Value != null)
                .ToDictionary(kv => kv.Key, kv => kv.Value),
            System.Collections.IEnumerable list => list.Cast<object?>().Select(WithoutNulls).Where(v => v != null).ToList(),
            _ => value,
        };

        public static string BuildJsonLdScript(IEnumerable<object> nodes, string? nonce = null) =>
            "<script type=\"application/ld+json\" nonce=\"" + (nonce ?? "{NONCE}") + "\"" + Marker + ">" + SerializeJsonLd(nodes) + "</script>";

        /// <summary>Replaces the marker regions; the markers themselves do not survive.</summary>
        public static string Inject(string indexHtml, string head, string body)
        {
            var result = ReplaceRegion(indexHtml, HeadStart, HeadEnd, head);
            return ReplaceRegion(result, BodyStart, BodyEnd, body);
        }

        private static string ReplaceRegion(string html, string start, string end, string replacement)
        {
            var s = html.IndexOf(start, StringComparison.Ordinal);
            var e = html.IndexOf(end, StringComparison.Ordinal);
            if (s < 0 || e < s) return html;
            return html[..s] + replacement + html[(e + end.Length)..];
        }

        // ---------- shared JSON-LD nodes ----------

        public static object Organization(SeoConfig c) => new Dictionary<string, object?>
        {
            ["@type"] = "Organization",
            ["@id"] = c.SiteUrl + "/#organization",
            ["name"] = c.Organization.Name,
            ["alternateName"] = c.Organization.AlternateName,
            ["url"] = c.SiteUrl + "/",
            ["logo"] = AbsoluteUrl(c.SiteUrl, c.Organization.Logo),
            ["email"] = c.Organization.Email,
            ["telephone"] = c.Organization.Telephone,
            ["address"] = PostalAddress(c),
            ["founder"] = Founder(c),
            ["sameAs"] = c.Organization.SameAs,
        };

        private static object PostalAddress(SeoConfig c) => new Dictionary<string, object?>
        {
            ["@type"] = "PostalAddress",
            ["streetAddress"] = c.Organization.StreetAddress,
            ["addressLocality"] = c.Organization.AddressLocality,
            ["addressRegion"] = c.Organization.AddressRegion,
            ["postalCode"] = c.Organization.PostalCode,
            ["addressCountry"] = c.Organization.AddressCountry,
        };

        /// <summary>The physical shop (Store is a LocalBusiness subtype), owned by the Organization.</summary>
        public static object LocalBusiness(SeoConfig c) => new Dictionary<string, object?>
        {
            ["@type"] = "Store",
            ["@id"] = c.SiteUrl + "/#store",
            ["name"] = c.Organization.Name,
            ["url"] = c.SiteUrl + "/",
            ["image"] = AbsoluteUrl(c.SiteUrl, c.Organization.Logo),
            ["email"] = c.Organization.Email,
            ["telephone"] = c.Organization.Telephone,
            ["address"] = PostalAddress(c),
            ["openingHours"] = c.Organization.OpeningHours.Count == 0 ? null : c.Organization.OpeningHours,
            ["priceRange"] = "₹",
            ["parentOrganization"] = new Dictionary<string, object?> { ["@id"] = c.SiteUrl + "/#organization" },
            ["sameAs"] = c.Organization.SameAs,
        };

        /// <summary>Founder as a Person; null when routes.json has no founder.</summary>
        public static Dictionary<string, object?>? Founder(SeoConfig c) => c.Organization.Founder is not { } f ? null : new()
        {
            ["@type"] = "Person",
            ["@id"] = c.SiteUrl + "/#founder",
            ["name"] = f.Name,
            ["jobTitle"] = f.JobTitle,
            ["image"] = string.IsNullOrWhiteSpace(f.Image) ? null : AbsoluteUrl(c.SiteUrl, f.Image),
        };

        public static object WebSite(SeoConfig c) => new Dictionary<string, object?>
        {
            ["@type"] = "WebSite",
            ["@id"] = c.SiteUrl + "/#website",
            ["name"] = c.SiteName,
            ["alternateName"] = c.Organization.AlternateName,
            ["url"] = c.SiteUrl + "/",
            ["publisher"] = new Dictionary<string, object?> { ["@id"] = c.SiteUrl + "/#organization" },
        };

        public static object Breadcrumbs(SeoConfig c, IEnumerable<(string Name, string Path)> items) => new Dictionary<string, object?>
        {
            ["@type"] = "BreadcrumbList",
            ["itemListElement"] = items.Select((item, i) => new Dictionary<string, object?>
            {
                ["@type"] = "ListItem",
                ["position"] = i + 1,
                ["name"] = item.Name,
                ["item"] = CanonicalUrl(c.SiteUrl, item.Path),
            }).ToList(),
        };

        public static object ItemList(SeoConfig c, IEnumerable<(string Name, string Path)> items) => new Dictionary<string, object?>
        {
            ["@type"] = "ItemList",
            ["itemListElement"] = items.Select((item, i) => new Dictionary<string, object?>
            {
                ["@type"] = "ListItem",
                ["position"] = i + 1,
                ["name"] = item.Name,
                ["url"] = CanonicalUrl(c.SiteUrl, item.Path),
            }).ToList(),
        };

        public static Dictionary<string, object?> WebPageNode(SeoConfig c, string type, SeoPage page) => new()
        {
            ["@type"] = type,
            ["@id"] = CanonicalUrl(c.SiteUrl, page.Path) + "#webpage",
            ["url"] = CanonicalUrl(c.SiteUrl, page.Path),
            ["name"] = page.Title,
            ["description"] = page.Description,
            ["isPartOf"] = new Dictionary<string, object?> { ["@id"] = c.SiteUrl + "/#website" },
        };

        // ---------- products ----------

        private static readonly Regex SlugDrop = new(@"[^a-z0-9\s-]", RegexOptions.Compiled);
        private static readonly Regex SlugJoin = new(@"[\s-]+", RegexOptions.Compiled);

        /// <summary>
        /// URL slug from a product name ("Beet Radiance - Beetroot Soap" → "beet-radiance-beetroot-soap").
        /// Same rule as toProductSlug() in the client (src/utils/productFormat.ts).
        /// </summary>
        public static string ProductSlug(string? name) =>
            SlugJoin.Replace(SlugDrop.Replace((name ?? string.Empty).ToLowerInvariant(), ""), "-").Trim('-');

        /// <summary>
        /// Canonical path per product id: /product/{slug}. When two products share a slug the lowest id
        /// keeps it (that is the product the slug resolves to) and the others stay on /product/{id};
        /// so does a product whose name has no usable characters.
        /// </summary>
        public static Dictionary<int, string> ProductPaths(IEnumerable<(int Id, string? Name)> products)
        {
            var paths = new Dictionary<int, string>();
            var taken = new HashSet<string>();
            foreach (var (id, name) in products.OrderBy(p => p.Id))
            {
                var slug = ProductSlug(name);
                paths[id] = "/product/" + (slug.Length > 0 && taken.Add(slug) ? slug : id.ToString(CultureInfo.InvariantCulture));
            }
            return paths;
        }

        public static string CleanText(string? text) =>
            Whitespace.Replace(HtmlTag.Replace(HiyaMetaBlock.Replace(text ?? string.Empty, " "), " "), " ").Trim();

        private static readonly Regex HiyaMetaJson =new(@"<!--HIYA_META:\s*([\s\S]*?)\s*-->", RegexOptions.Compiled);

        /// <summary>
        /// Ingredients and benefits saved by the admin in the &lt;!--HIYA_META: {...} --&gt; block of
        /// FullDescription (format: src/utils/productMetaStore.ts). Only real saved values: the client's
        /// per-category placeholder lists are never used here. Empty lists when missing or invalid.
        /// </summary>
        public static ProductMetaInfo ProductMeta(string? fullDescription)
        {
            var empty = new ProductMetaInfo(new(), new(), "", "", new());
            var match = HiyaMetaJson.Match(fullDescription ?? string.Empty);
            if (!match.Success) return empty;
            try
            {
                using var doc = JsonDocument.Parse(match.Groups[1].Value);
                var root = doc.RootElement;
                if (root.ValueKind != JsonValueKind.Object) return empty;

                List<string> Strings(string name) =>
                    root.TryGetProperty(name, out var arr) && arr.ValueKind == JsonValueKind.Array
                        ? arr.EnumerateArray().Where(x => x.ValueKind == JsonValueKind.String)
                            .Select(x => CleanText(x.GetString())).Where(x => x.Length > 0).ToList()
                        : new List<string>();
                string Text(string name) =>
                    root.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String ? (v.GetString() ?? "").Trim() : "";
                string Field(JsonElement el, string name) =>
                    el.ValueKind == JsonValueKind.Object && el.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String ? (v.GetString() ?? "").Trim() : "";

                var faqs = root.TryGetProperty("faqs", out var list) && list.ValueKind == JsonValueKind.Array
                    ? list.EnumerateArray().Select(f => (Question: Field(f, "question"), Answer: Field(f, "answer")))
                        .Where(f => f.Question.Length > 0 && f.Answer.Length > 0).ToList()
                    : new List<(string Question, string Answer)>();

                return new ProductMetaInfo(Strings("ingredients"), Strings("benefits"), Text("shelfLife"), Text("howToUse"), faqs);
            }
            catch (JsonException)
            {
                return empty;
            }
        }

        /// <summary>FAQPage node for a product's own FAQs (admin: How to Use, Shelf Life &amp; FAQs).</summary>
        public static object ProductFaqNode(SeoConfig c, string productPath, IEnumerable<(string Question, string Answer)> faqs) => new Dictionary<string, object?>
        {
            ["@type"] = "FAQPage",
            ["@id"] = CanonicalUrl(c.SiteUrl, productPath) + "#faq",
            ["about"] = new Dictionary<string, object?> { ["@id"] = CanonicalUrl(c.SiteUrl, productPath) + "#product" },
            ["mainEntity"] = faqs.Select(f => new Dictionary<string, object?>
            {
                ["@type"] = "Question",
                ["name"] = f.Question,
                ["acceptedAnswer"] = new Dictionary<string, object?> { ["@type"] = "Answer", ["text"] = f.Answer },
            }).ToList(),
        };

        /// <summary>
        /// Product page title: "{Name} {Category} | {site}" (e.g. "Choco Masti Mukhwas | HIYAGHAR"). The
        /// category is left out when the name already contains its last word, plural-insensitive
        /// ("Keshvedaam Herbal Hair Oil", "... 3-Pack Combo"). Same rule as buildProductSeoTitle() in
        /// the client (src/seo/routeSeo.ts).
        /// </summary>
        public static string ProductTitle(string name, string? categoryName, string siteName)
        {
            static string Stem(string w) => w.ToLowerInvariant().EndsWith('s') ? w.ToLowerInvariant()[..^1] : w.ToLowerInvariant();
            var category = (categoryName ?? "").Trim();
            var lastWord = category.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).LastOrDefault() ?? "";
            var nameHasCategory = lastWord.Length > 0 && Regex.Split(name.ToLowerInvariant(), "[^a-z0-9]+")
                .Any(w => w.Length > 0 && Stem(w) == Stem(lastWord));
            return $"{(category.Length > 0 && !nameHasCategory ? $"{name} {category}" : name)} | {siteName}";
        }

        /// <summary>Same rule as buildProductSeoDescription() in the client (src/seo/routeSeo.ts).</summary>
        public static string ProductDescription(Product p, string template)
        {
            var category = p.Category?.CategoryName ?? "General";
            var sentence = template.Replace("{name}", p.ProductName)
                .Replace("{category}", string.IsNullOrEmpty(category) ? "" : category + " ");
            var text = CleanText(p.ShortDescription);
            if (text.Length == 0) text = CleanText(p.FullDescription);
            // Real text shorter than 120 chars gets the template sentence appended (same as the client).
            text = text.Length == 0 ? sentence : text.Length < 120 ? text + " " + sentence : text;
            if (text.Length <= 160) return text;
            var cut = text[..159];
            var space = cut.LastIndexOf(' ');
            return cut[..(space > 120 ? space : 159)] + "…";
        }

        public static List<ProductVariant> SellableVariants(Product p) =>
            p.Variants.Where(v => !v.IsDeleted).OrderByDescending(v => v.IsDefault).ThenBy(v => v.Id).ToList();

        public static int SellableStock(ProductVariant v) => v.AvailableStock - v.ReservedStock;

        /// <summary>Main image first, then the gallery (primary first, display order), as absolute URLs.</summary>
        public static List<string> ProductImages(SeoConfig c, Product p, string fallbackImage)
        {
            var paths = new List<string>();
            if (!string.IsNullOrWhiteSpace(p.MainImagePath)) paths.Add(p.MainImagePath!);
            paths.AddRange(p.Images.Where(i => !i.IsDeleted && !string.IsNullOrWhiteSpace(i.ImagePath))
                .OrderByDescending(i => i.IsPrimary).ThenBy(i => i.DisplayOrder).Select(i => i.ImagePath));
            if (paths.Count == 0) paths.Add(fallbackImage);
            return paths.Distinct(StringComparer.OrdinalIgnoreCase).Select(x => AbsoluteUrl(c.SiteUrl, x)).ToList();
        }

        public static string VariantLabel(ProductVariant v) =>
            string.IsNullOrWhiteSpace(v.VariantName) || v.VariantName.Trim().Equals("No Variant", StringComparison.OrdinalIgnoreCase)
                ? string.Empty
                : v.VariantName.Trim();

        /// <summary>Product node: one Offer per variant (own price, SKU and stock). No ratings or reviews.</summary>
        /// <summary>A review shown on the product page by a verified buyer (Services/ReviewVerification.cs).</summary>
        public record ProductReview(string Author, int Rating, string Text, DateTime Date);

        /// <summary>
        /// Product node. <paramref name="verifiedReviews"/>: only reviews by customers who received the
        /// product; when there is at least one, aggregateRating and up to 5 reviews are added.
        /// </summary>
        public static object ProductNode(SeoConfig c, Product p, string description, List<string> images, string? path = null, IReadOnlyList<ProductReview>? verifiedReviews = null)
        {
            var url = CanonicalUrl(c.SiteUrl, path ?? "/product/" + p.Id);
            var variants = SellableVariants(p);
            var offers = variants.Select(v => new Dictionary<string, object?>
            {
                ["@type"] = "Offer",
                ["name"] = VariantLabel(v) is { Length: > 0 } label ? label : null,
                ["sku"] = string.IsNullOrWhiteSpace(v.SKU) ? null : v.SKU,
                ["price"] = v.Price,
                ["priceCurrency"] = "INR",
                ["availability"] = SellableStock(v) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                ["itemCondition"] = "https://schema.org/NewCondition",
                ["url"] = url,
            }).ToList<object>();

            if (offers.Count == 0)
            {
                // No variant rows: price only; availability is unknown, so it is left out.
                offers.Add(new Dictionary<string, object?>
                {
                    ["@type"] = "Offer",
                    ["price"] = p.DiscountPrice ?? p.BasePrice,
                    ["priceCurrency"] = "INR",
                    ["itemCondition"] = "https://schema.org/NewCondition",
                    ["url"] = url,
                });
            }

            return new Dictionary<string, object?>
            {
                ["@type"] = "Product",
                ["@id"] = url + "#product",
                ["name"] = p.ProductName,
                ["image"] = images,
                ["description"] = description,
                ["sku"] = variants.Select(v => v.SKU).FirstOrDefault(s => !string.IsNullOrWhiteSpace(s)) ?? p.Id.ToString(CultureInfo.InvariantCulture),
                ["brand"] = new Dictionary<string, object?> { ["@type"] = "Brand", ["name"] = c.SiteName },
                ["category"] = p.Category?.CategoryName,
                ["url"] = url,
                ["offers"] = offers,
                ["aggregateRating"] = verifiedReviews is { Count: > 0 } ? new Dictionary<string, object?>
                {
                    ["@type"] = "AggregateRating",
                    ["ratingValue"] = Math.Round(verifiedReviews.Average(r => r.Rating), 1),
                    ["reviewCount"] = verifiedReviews.Count,
                    ["bestRating"] = 5,
                    ["worstRating"] = 1,
                } : null,
                ["review"] = verifiedReviews is { Count: > 0 } ? verifiedReviews.Take(5).Select(r => (object)new Dictionary<string, object?>
                {
                    ["@type"] = "Review",
                    ["author"] = new Dictionary<string, object?> { ["@type"] = "Person", ["name"] = r.Author },
                    ["reviewRating"] = new Dictionary<string, object?> { ["@type"] = "Rating", ["ratingValue"] = r.Rating, ["bestRating"] = 5, ["worstRating"] = 1 },
                    ["reviewBody"] = r.Text,
                    ["datePublished"] = r.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                }).ToList() : null,
            };
        }

        public static string FormatPrice(decimal price) => "₹" + price.ToString("0.##", CultureInfo.InvariantCulture);

        // ---------- pre-render body ----------

        /// <summary>
        /// Crawlable page content placed inside &lt;div id="root"&gt;. Unlike &lt;noscript&gt; (which some
        /// crawlers skip) it is real DOM; createRoot().render() replaces it as soon as the app starts.
        /// </summary>
        public static string Prerender(string inner) => "<div" + Marker + " class=\"seo-prerender\">" + inner + "</div>";

        public static string Heading(string? h1, string? intro)
        {
            var sb = new StringBuilder();
            if (!string.IsNullOrWhiteSpace(h1)) sb.Append("<h1>").Append(E(h1)).Append("</h1>");
            if (!string.IsNullOrWhiteSpace(intro)) sb.Append("<p>").Append(E(intro)).Append("</p>");
            return sb.ToString();
        }

        /// <summary>Guide paragraphs and FAQs with text (blank entries are ignored), as in CategoryGuide.tsx.</summary>
        public static (List<string> Paragraphs, List<(string Question, string Answer)> Faqs) GuideContent(SeoGuide? guide) => (
            (guide?.Paragraphs ?? new()).Where(p => !string.IsNullOrWhiteSpace(p)).Select(p => p.Trim()).ToList(),
            (guide?.Faqs ?? new()).Where(f => !string.IsNullOrWhiteSpace(f.Question) && !string.IsNullOrWhiteSpace(f.Answer))
                .Select(f => (f.Question.Trim(), f.Answer.Trim())).ToList());

        /// <summary>Category guide body: heading + paragraphs, then each FAQ as an h3 with its answer (same order as CategoryGuide.tsx).</summary>
        public static string GuideSection(SeoGuide? guide)
        {
            var (paragraphs, faqs) = GuideContent(guide);
            if (paragraphs.Count == 0 && faqs.Count == 0) return string.Empty;
            var sb = new StringBuilder("<section>");
            if (paragraphs.Count > 0)
            {
                if (!string.IsNullOrWhiteSpace(guide?.Heading)) sb.Append("<h2>").Append(E(guide!.Heading)).Append("</h2>");
                foreach (var p in paragraphs) sb.Append("<p>").Append(E(p)).Append("</p>");
            }
            if (faqs.Count > 0)
            {
                sb.Append("<h2>Frequently Asked Questions</h2>");
                foreach (var (q, a) in faqs) sb.Append("<h3>").Append(E(q)).Append("</h3><p>").Append(E(a)).Append("</p>");
            }
            return sb.Append("</section>").ToString();
        }

        /// <summary>FAQPage node for a page's own visible FAQs (category pages).</summary>
        public static object FaqPageNode(SeoConfig c, string path, IEnumerable<(string Question, string Answer)> faqs) => new Dictionary<string, object?>
        {
            ["@type"] = "FAQPage",
            ["@id"] = CanonicalUrl(c.SiteUrl, path) + "#faq",
            ["url"] = CanonicalUrl(c.SiteUrl, path),
            ["mainEntity"] = faqs.Select(f => new Dictionary<string, object?>
            {
                ["@type"] = "Question",
                ["name"] = f.Question,
                ["acceptedAnswer"] = new Dictionary<string, object?> { ["@type"] = "Answer", ["text"] = f.Answer },
            }).ToList(),
        };

        public record FaqGroup(string Heading, List<SeoLink> Related, List<(string Question, string Answer)> Faqs);

        /// <summary>
        /// FAQs grouped by the configured categories, in config order (FAQs keep their order inside a
        /// group). FAQs whose category is not configured come last under "More Questions". Empty
        /// groups are left out. Same grouping as src/pages/Faq/FaqPage.tsx.
        /// </summary>
        public static List<FaqGroup> GroupFaqs(IEnumerable<SeoFaqCategory> categories, IEnumerable<(string? Category, string Question, string Answer)> faqs)
        {
            var list = faqs.ToList();
            var known = categories.Where(c => !string.IsNullOrWhiteSpace(c.Key)).ToList();
            bool Is(string? category, string key) => string.Equals((category ?? "").Trim(), key, StringComparison.OrdinalIgnoreCase);

            var groups = known
                .Select(c => new FaqGroup(c.Heading, c.Related, list.Where(f => Is(f.Category, c.Key)).Select(f => (f.Question, f.Answer)).ToList()))
                .ToList();
            var other = list.Where(f => !known.Any(c => Is(f.Category, c.Key))).Select(f => (f.Question, f.Answer)).ToList();
            groups.Add(new FaqGroup("More Questions", new List<SeoLink>(), other));
            return groups.Where(g => g.Faqs.Count > 0).ToList();
        }

        /// <summary>FAQ page body: per group an h2, each question an h3 with its answer below, then the related links.</summary>
        public static string FaqSections(IEnumerable<FaqGroup> groups)
        {
            var sb = new StringBuilder();
            foreach (var g in groups)
            {
                sb.Append("<section><h2>").Append(E(g.Heading)).Append("</h2>");
                foreach (var (question, answer) in g.Faqs)
                {
                    sb.Append("<h3>").Append(E(question)).Append("</h3><p>").Append(E(answer)).Append("</p>");
                }
                if (g.Related.Count > 0)
                {
                    sb.Append("<p>Related: ").Append(string.Join(", ", g.Related
                        .Select(l => "<a href=\"" + E(l.Path) + "\">" + E(l.Text) + "</a>"))).Append("</p>");
                }
                sb.Append("</section>");
            }
            return sb.ToString();
        }

        public static string LinkList(IEnumerable<(string Text, string Path)> links)
        {
            var items = links.Select(l => "<li><a href=\"" + E(l.Path) + "\">" + E(l.Text) + "</a></li>").ToList();
            return items.Count == 0 ? string.Empty : "<ul>" + string.Concat(items) + "</ul>";
        }
    }
}
