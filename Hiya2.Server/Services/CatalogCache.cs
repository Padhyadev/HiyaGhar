using Microsoft.AspNetCore.OutputCaching;

namespace Hiya2.Server.Services
{
    /// <summary>
    /// Server-side copies of catalog data: the output-cached product list ("catalog" tag) and the
    /// server-rendered SEO pages (keyed by <see cref="Version"/>). Invalidated after any saved
    /// change to products, stock, categories, attributes or orders, so the shop never shows an old
    /// price, image or stock level until a cache happens to expire.
    /// </summary>
    public static class CatalogCache
    {
        private static int _version;

        public static int Version => Volatile.Read(ref _version);

        private static readonly string[] CatalogApiPrefixes =
        {
            "/api/product", "/api/stock", "/api/category", "/api/attribute",
            "/api/gifthamper", "/api/order", "/api/payment",
            // Cart changes reserve/release stock, which changes the "X left" shown on product cards.
            "/api/cart", "/api/stockreservation",
        };

        public static bool IsCatalogWrite(HttpContext context)
        {
            if (HttpMethods.IsGet(context.Request.Method) || HttpMethods.IsHead(context.Request.Method)) return false;
            if (context.Response.StatusCode < 200 || context.Response.StatusCode >= 300) return false;
            var path = context.Request.Path;
            return CatalogApiPrefixes.Any(prefix => path.StartsWithSegments(prefix, StringComparison.OrdinalIgnoreCase));
        }

        public static async Task InvalidateAsync(IOutputCacheStore store)
        {
            Interlocked.Increment(ref _version);
            await store.EvictByTagAsync("catalog", default);
        }
    }
}
