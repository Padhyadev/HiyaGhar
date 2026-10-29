using System.Text.Json;
using System.Text.RegularExpressions;
using HIyaghar.Infra;
using Microsoft.EntityFrameworkCore;

namespace Hiya2.Server.Services
{
    /// <summary>One product line inside a combo (admin: Catalog &gt; Combos).</summary>
    public record ComboItemRef(int ProductId, int VariantId, int Quantity, string Name, string Variant);

    /// <summary>
    /// Combos are ordinary products in the "Combos" category with one hidden variant: its Price is the
    /// combo selling price the admin entered (what the customer pays) and its OriginalPrice is the
    /// total of the included items' current selling prices (shown struck through).
    /// The included items are stored in the product's HIYA_META block as "comboItems".
    /// RecalculateAsync keeps OriginalPrice equal to that total whenever a product price changes.
    /// </summary>
    public static class ComboPricing
    {
        public const string CategoryName = "Combos";

        private static readonly Regex HiyaMetaJson = new(@"<!--HIYA_META:\s*([\s\S]*?)\s*-->", RegexOptions.Compiled);

        /// <summary>The combo's items from FullDescription; empty when it is not a combo or the block is invalid.</summary>
        public static List<ComboItemRef> ParseItems(string? fullDescription)
        {
            var match = HiyaMetaJson.Match(fullDescription ?? string.Empty);
            if (!match.Success) return new();
            try
            {
                using var doc = JsonDocument.Parse(match.Groups[1].Value);
                if (doc.RootElement.ValueKind != JsonValueKind.Object
                    || !doc.RootElement.TryGetProperty("comboItems", out var list)
                    || list.ValueKind != JsonValueKind.Array) return new();

                static int Int(JsonElement e, string name) =>
                    e.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.Number && v.TryGetInt32(out var n) ? n : 0;
                static string Str(JsonElement e, string name) =>
                    e.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String ? (v.GetString() ?? "").Trim() : "";

                return list.EnumerateArray()
                    .Where(e => e.ValueKind == JsonValueKind.Object)
                    .Select(e => new ComboItemRef(Int(e, "productId"), Int(e, "variantId"), Int(e, "quantity"), Str(e, "name"), Str(e, "variant")))
                    .Where(i => i.ProductId > 0 && i.VariantId > 0 && i.Quantity > 0)
                    .ToList();
            }
            catch (JsonException)
            {
                return new();
            }
        }

        /// <summary>Sum of quantity x current selling price; null if any item's variant no longer exists.</summary>
        public static decimal? Total(IEnumerable<ComboItemRef> items, IReadOnlyDictionary<int, decimal> variantPrices)
        {
            decimal total = 0;
            foreach (var item in items)
            {
                if (!variantPrices.TryGetValue(item.VariantId, out var price)) return null;
                total += price * item.Quantity;
            }
            return total;
        }

        /// <summary>
        /// Sets every combo's OriginalPrice to the current total of its items. The combo selling price
        /// (Price) is never changed here - only the admin sets it. Returns the number of combos updated.
        /// </summary>
        public static async Task<int> RecalculateAsync(DataContext db)
        {
            var combos = await db.Products
                .Where(p => !p.IsDeleted && p.Category != null && p.Category.CategoryName == CategoryName)
                .Include(p => p.Variants.Where(v => !v.IsDeleted))
                .ToListAsync();
            if (combos.Count == 0) return 0;

            var itemsByCombo = combos.ToDictionary(c => c.Id, c => ParseItems(c.FullDescription));
            var variantIds = itemsByCombo.Values.SelectMany(i => i).Select(i => i.VariantId).Distinct().ToList();
            var prices = await db.ProductVariants
                .Where(v => variantIds.Contains(v.Id) && !v.IsDeleted && v.Product != null && !v.Product.IsDeleted)
                .ToDictionaryAsync(v => v.Id, v => v.Price);

            var updated = 0;
            foreach (var combo in combos)
            {
                var items = itemsByCombo[combo.Id];
                if (items.Count == 0) continue;
                var total = Total(items, prices);
                if (total == null) continue;

                foreach (var v in combo.Variants.Where(v => v.OriginalPrice != total))
                {
                    v.OriginalPrice = total;
                    v.LastModifiedDate = DateTime.Now;
                    updated++;
                }
                if (combo.BasePrice != total.Value)
                {
                    combo.BasePrice = total.Value;
                }
            }

            if (updated > 0) await db.SaveChangesAsync();
            return updated;
        }
    }
}
