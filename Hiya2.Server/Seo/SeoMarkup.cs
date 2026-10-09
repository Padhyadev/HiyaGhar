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
        /// <summary>Already-encoded HTML for the &lt;noscript&gt; block.</summary>
        public string BodyHtml { get; set; } = string.Empty;
    }

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
            ["url"] = c.SiteUrl + "/",
            ["logo"] = AbsoluteUrl(c.SiteUrl, c.Organization.Logo),
            ["email"] = c.Organization.Email,
            ["telephone"] = c.Organization.Telephone,
            ["address"] = new Dictionary<string, object?>
            {
                ["@type"] = "PostalAddress",
                ["addressLocality"] = c.Organization.AddressLocality,
                ["addressRegion"] = c.Organization.AddressRegion,
                ["addressCountry"] = c.Organization.AddressCountry,
            },
            ["sameAs"] = c.Organization.SameAs,
        };

        public static object WebSite(SeoConfig c) => new Dictionary<string, object?>
        {
            ["@type"] = "WebSite",
            ["@id"] = c.SiteUrl + "/#website",
            ["name"] = c.SiteName,
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

        public static string CleanText(string? text) =>
            Whitespace.Replace(HtmlTag.Replace(HiyaMetaBlock.Replace(text ?? string.Empty, " "), " "), " ").Trim();

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
        public static object ProductNode(SeoConfig c, Product p, string description, List<string> images)
        {
            var url = CanonicalUrl(c.SiteUrl, "/product/" + p.Id);
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
            };
        }

        public static string FormatPrice(decimal price) => "₹" + price.ToString("0.##", CultureInfo.InvariantCulture);

        // ---------- <noscript> body ----------

        public static string NoScript(string inner) => "<noscript" + Marker + ">" + inner + "</noscript>";

        public static string Heading(string? h1, string? intro)
        {
            var sb = new StringBuilder();
            if (!string.IsNullOrWhiteSpace(h1)) sb.Append("<h1>").Append(E(h1)).Append("</h1>");
            if (!string.IsNullOrWhiteSpace(intro)) sb.Append("<p>").Append(E(intro)).Append("</p>");
            return sb.ToString();
        }

        public static string LinkList(IEnumerable<(string Text, string Path)> links)
        {
            var items = links.Select(l => "<li><a href=\"" + E(l.Path) + "\">" + E(l.Text) + "</a></li>").ToList();
            return items.Count == 0 ? string.Empty : "<ul>" + string.Concat(items) + "</ul>";
        }
    }
}
