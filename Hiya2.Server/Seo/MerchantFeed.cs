using System.Globalization;
using System.Security;
using System.Text;
using Hiya2.Server.Models;

namespace Hiya2.Server.Seo
{
    /// <summary>
    /// Google Merchant Center product feed (RSS 2.0 + g: namespace), served at
    /// /feeds/google-products.xml. One item per sellable variant, grouped by product
    /// (item_group_id). Pure builder (no I/O) so it can be unit-tested.
    /// Items are left out rather than sent with guessed data: a variant needs a price and its own
    /// photo (same rule as the storefront's getVariantImages - another variant's photo is never
    /// borrowed), and products without variants are skipped because their stock is unknown.
    /// Shipping and returns are configured in Merchant Center itself.
    /// </summary>
    public static class MerchantFeed
    {
        private const int MaxDescription = 5000;

        public static string Build(IEnumerable<Product> products, SeoConfig c, IReadOnlyDictionary<int, string> productPaths)
        {
            var sb = new StringBuilder();
            sb.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
            sb.AppendLine("<rss version=\"2.0\" xmlns:g=\"http://base.google.com/ns/1.0\">");
            sb.AppendLine("  <channel>");
            sb.AppendLine($"    <title>{X(c.SiteName)}</title>");
            sb.AppendLine($"    <link>{X(c.SiteUrl + "/")}</link>");
            sb.AppendLine($"    <description>{X(c.SiteName + " products")}</description>");

            foreach (var p in products.Where(p => p.IsActive && !p.IsDeleted).OrderBy(p => p.Id))
            {
                var variants = SeoMarkup.SellableVariants(p);
                var path = productPaths.TryGetValue(p.Id, out var pp) ? pp : "/product/" + p.Id;
                var link = SeoMarkup.CanonicalUrl(c.SiteUrl, path);
                var description = Description(p, c);

                foreach (var v in variants)
                {
                    var image = VariantImage(p, v);
                    if (image == null || v.Price <= 0) continue;

                    var label = VariantTitle(v);
                    var onSale = v.OriginalPrice is decimal orig && orig > v.Price;

                    sb.AppendLine("    <item>");
                    Tag(sb, "g:id", $"{p.Id}-{v.Id}");
                    Tag(sb, "g:item_group_id", p.Id.ToString(CultureInfo.InvariantCulture));
                    Tag(sb, "g:title", label.Length > 0 ? $"{p.ProductName.Trim()} - {label}" : p.ProductName.Trim());
                    Tag(sb, "g:description", description);
                    Tag(sb, "g:link", link);
                    Tag(sb, "g:image_link", SeoMarkup.AbsoluteUrl(c.SiteUrl, image));
                    Tag(sb, "g:availability", SeoMarkup.SellableStock(v) > 0 ? "in_stock" : "out_of_stock");
                    Tag(sb, "g:price", Money(onSale ? v.OriginalPrice!.Value : v.Price));
                    if (onSale) Tag(sb, "g:sale_price", Money(v.Price));
                    Tag(sb, "g:condition", "new");
                    Tag(sb, "g:brand", c.SiteName);
                    Tag(sb, "g:identifier_exists", "no");
                    if (!string.IsNullOrWhiteSpace(v.SKU)) Tag(sb, "g:mpn", v.SKU.Trim());
                    if (!string.IsNullOrWhiteSpace(p.Category?.CategoryName)) Tag(sb, "g:product_type", p.Category!.CategoryName.Trim());
                    sb.AppendLine("    </item>");
                }
            }

            sb.AppendLine("  </channel>");
            sb.AppendLine("</rss>");
            return sb.ToString();
        }

        /// <summary>
        /// The variant's own photo, else the product's common photo, else the main image - but only
        /// when no variant has its own photos (then a variant without photos has none).
        /// Mirrors getVariantImages() in src/utils/productFormat.ts.
        /// </summary>
        public static string? VariantImage(Product p, ProductVariant v)
        {
            static IEnumerable<ProductImage> Ordered(IEnumerable<ProductImage> images) => images
                .Where(i => !i.IsDeleted && !string.IsNullOrWhiteSpace(i.ImagePath))
                .OrderByDescending(i => i.IsPrimary).ThenBy(i => i.DisplayOrder);

            var all = p.Images.Concat(p.Variants.SelectMany(x => x.Images)).DistinctBy(i => i.Id).ToList();
            var own = Ordered(all.Where(i => i.VariantId == v.Id)).FirstOrDefault();
            if (own != null) return own.ImagePath;
            var common = Ordered(all.Where(i => i.VariantId == null)).FirstOrDefault();
            if (common != null) return common.ImagePath;
            var anyVariantPhotos = all.Any(i => i.VariantId != null && !i.IsDeleted && !string.IsNullOrWhiteSpace(i.ImagePath));
            if (anyVariantPhotos) return null;
            return string.IsNullOrWhiteSpace(p.MainImagePath) ? null : p.MainImagePath;
        }

        /// <summary>"Weight: 150 g, Packing: Pouch" → "150 g, Pouch" (like formatVariantLabel in the client).</summary>
        public static string VariantTitle(ProductVariant v)
        {
            var label = SeoMarkup.VariantLabel(v);
            if (label.Length == 0) return label;
            return string.Join(", ", label.Split(',')
                .Select(part => part.Contains(':') ? part[(part.IndexOf(':') + 1)..] : part)
                .Select(part => part.Trim())
                .Where(part => part.Length > 0));
        }

        private static string Description(Product p, SeoConfig c)
        {
            var text = SeoMarkup.CleanText(p.FullDescription);
            if (text.Length == 0) text = SeoMarkup.CleanText(p.ShortDescription);
            if (text.Length == 0) text = SeoMarkup.ProductDescription(p, c.ProductDescriptionTemplate);
            return text.Length <= MaxDescription ? text : text[..MaxDescription];
        }

        private static string Money(decimal amount) => amount.ToString("0.00", CultureInfo.InvariantCulture) + " INR";

        private static string X(string text) => SecurityElement.Escape(text) ?? string.Empty;

        private static void Tag(StringBuilder sb, string name, string value) =>
            sb.Append("      <").Append(name).Append('>').Append(X(value)).Append("</").Append(name).AppendLine(">");
    }
}
