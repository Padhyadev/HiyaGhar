using HIyaghar.Infra;
using Hiya2.Server.Repositories.GiftHamper;
using Hiya2.Server.Repositories.Product;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Hiya2.Server.Seo
{
    public record SeoRenderResult(int StatusCode, string? Html);

    /// <summary>
    /// Serves the SPA shell with per-route SEO tags and crawlable &lt;noscript&gt; content injected.
    /// Status: 200 for routes in seo/routes.json and for active products, 404 otherwise (the React
    /// app still renders its 404 view). Uses the same repositories/queries as the public API.
    /// Rendered pages are cached per path for 5 minutes (there is no product-change hook to evict on).
    /// </summary>
    public class SeoPageRenderer
    {
        private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

        private readonly SeoContentStore _store;
        private readonly IProductRepository _products;
        private readonly IGiftHamperRepository _hampers;
        private readonly DataContext _db;
        private readonly IMemoryCache _cache;

        public SeoPageRenderer(SeoContentStore store, IProductRepository products, IGiftHamperRepository hampers, DataContext db, IMemoryCache cache)
        {
            _store = store;
            _products = products;
            _hampers = hampers;
            _db = db;
            _cache = cache;
        }

        public async Task<SeoRenderResult> RenderAsync(string path)
        {
            var snapshot = _store.Get();
            var key = $"seo-page:{snapshot.Version}:{path.ToLowerInvariant()}";
            if (_cache.TryGetValue(key, out SeoRenderResult? cached) && cached != null) return cached;

            var (status, page) = await BuildPageAsync(path, snapshot);
            var html = snapshot.IndexHtml == null
                ? null
                : SeoMarkup.Inject(snapshot.IndexHtml, SeoMarkup.BuildHead(page, snapshot.Config), page.BodyHtml);

            var result = new SeoRenderResult(status, html);
            _cache.Set(key, result, CacheDuration);
            return result;
        }

        private async Task<(int Status, SeoPage Page)> BuildPageAsync(string path, SeoContentStore.Snapshot s)
        {
            var c = s.Config;
            var baseNodes = new List<object> { SeoMarkup.Organization(c), SeoMarkup.WebSite(c) };

            var route = c.FindRoute(path);
            if (route != null)
            {
                var page = NewPage(route, path, s.DefaultImage, baseNodes);
                await AddRouteContentAsync(route, page, c);
                return (StatusCodes.Status200OK, page);
            }

            if (path.StartsWith("/product/", StringComparison.OrdinalIgnoreCase)
                && int.TryParse(path["/product/".Length..], out var productId))
            {
                var product = await _products.GetByIdAsync(productId);
                if (product != null && product.IsActive && !product.IsDeleted)
                {
                    return (StatusCodes.Status200OK, BuildProductPage(product, c, s.DefaultImage, baseNodes));
                }
            }

            var notFound = NewPage(c.NotFound, path, s.DefaultImage, baseNodes);
            notFound.Noindex = true;
            notFound.BodyHtml = SeoMarkup.NoScript(SeoMarkup.Heading(c.NotFound.H1, c.NotFound.Intro)
                + SeoMarkup.LinkList(new[] { ("Back to Home", "/") }));
            return (StatusCodes.Status404NotFound, notFound);
        }

        private static SeoPage NewPage(SeoRoute route, string path, string defaultImage, List<object> baseNodes) => new()
        {
            Title = route.Title,
            Description = route.Description,
            Path = path,
            Image = defaultImage,
            Noindex = route.Noindex,
            JsonLd = new List<object>(baseNodes),
            BodyHtml = SeoMarkup.NoScript(SeoMarkup.Heading(route.H1, route.Intro)),
        };

        private async Task AddRouteContentAsync(SeoRoute route, SeoPage page, SeoConfig c)
        {
            var body = SeoMarkup.Heading(route.H1, route.Intro);
            Dictionary<string, object?>? pageNode = route.SchemaType != null ? SeoMarkup.WebPageNode(c, route.SchemaType, page) : null;

            if (route.HomeLinks)
            {
                body += SeoMarkup.LinkList(c.Routes
                    .Where(r => r.Sitemap && r.Path != "/" && r.Path != null)
                    .Select(r => (r.LinkText ?? r.H1 ?? r.Title, r.Path!)));
            }

            if (route.CategoryId.HasValue || route.Collection == "giftHampers")
            {
                var items = route.CategoryId.HasValue
                    ? (await _products.GetAllAsync(route.CategoryId.Value))
                        .Where(p => p.IsActive && !p.IsDeleted)
                        .Select(p => (p.ProductName, "/product/" + p.Id)).ToList()
                    : (await _hampers.GetAllOccasionsAsync(true))
                        .SelectMany(o => o.Products.Where(op => op.Product != null).OrderBy(op => op.DisplayOrder))
                        .Select(op => op.Product!)
                        .Where(p => p.IsActive && !p.IsDeleted)
                        .GroupBy(p => p.Id).Select(g => g.First())
                        .Select(p => (p.ProductName, "/product/" + p.Id)).ToList();

                // Same wording as the page's result count ("Showing 7 Mukhwas products", "Showing 8 products").
                var label = route.CategoryId.HasValue && route.Breadcrumb != null ? route.Breadcrumb + " " : "";
                body += "<p>" + SeoMarkup.E($"Showing {items.Count} {label}product{(items.Count == 1 ? "" : "s")}") + "</p>";
                body += SeoMarkup.LinkList(items);
                if (pageNode != null) pageNode["mainEntity"] = SeoMarkup.ItemList(c, items);
                page.JsonLd.Add(SeoMarkup.Breadcrumbs(c, new[] { ("Home", "/"), (route.Breadcrumb ?? route.H1 ?? route.Title, route.Path!) }));
            }

            if (route.SchemaType == "FAQPage")
            {
                // Same query as FaqController.GetPublicFaqs - the text the FAQ page renders.
                var faqs = await _db.Faqs.AsNoTracking()
                    .Where(f => !f.IsDeleted && f.IsActive)
                    .OrderBy(f => f.DisplayOrder).ThenBy(f => f.Id)
                    .Select(f => new { f.Question, f.Answer })
                    .ToListAsync();

                if (pageNode != null)
                {
                    pageNode["mainEntity"] = faqs.Select(f => new Dictionary<string, object?>
                    {
                        ["@type"] = "Question",
                        ["name"] = f.Question,
                        ["acceptedAnswer"] = new Dictionary<string, object?> { ["@type"] = "Answer", ["text"] = f.Answer },
                    }).ToList();
                }
                body += "<dl>" + string.Concat(faqs.Select(f => "<dt>" + SeoMarkup.E(f.Question) + "</dt><dd>" + SeoMarkup.E(f.Answer) + "</dd>")) + "</dl>";
            }

            if (route.ContactDetails)
            {
                var o = c.Organization;
                body += "<ul><li>" + SeoMarkup.E(o.Telephone) + "</li><li><a href=\"mailto:" + SeoMarkup.E(o.Email) + "\">" + SeoMarkup.E(o.Email)
                    + "</a></li><li>" + SeoMarkup.E($"{o.AddressLocality}, {o.AddressRegion}, India") + "</li></ul>";
            }

            if (!route.HomeLinks && route.Path != "/")
            {
                body += SeoMarkup.LinkList(new[] { ("Home", "/") });
            }

            if (pageNode != null) page.JsonLd.Add(pageNode);
            page.BodyHtml = SeoMarkup.NoScript(body);
        }

        private static SeoPage BuildProductPage(Models.Product p, SeoConfig c, string defaultImage, List<object> baseNodes)
        {
            var description = SeoMarkup.ProductDescription(p, c.ProductDescriptionTemplate);
            var images = SeoMarkup.ProductImages(c, p, defaultImage);
            var categoryRoute = c.Routes.FirstOrDefault(r => r.CategoryId == p.CategoryId);

            var page = new SeoPage
            {
                Title = $"{p.ProductName} | {c.SiteName}",
                Description = description,
                Path = "/product/" + p.Id,
                Image = images[0],
                OgType = "product",
                JsonLd = new List<object>(baseNodes) { SeoMarkup.ProductNode(c, p, description, images) },
            };

            var crumbs = new List<(string, string)> { ("Home", "/") };
            if (categoryRoute?.Path != null) crumbs.Add((categoryRoute.Breadcrumb ?? categoryRoute.H1 ?? categoryRoute.Title, categoryRoute.Path));
            crumbs.Add((p.ProductName, page.Path));
            page.JsonLd.Add(SeoMarkup.Breadcrumbs(c, crumbs));

            // Crawlable body: name, description, price(s), availability, category link.
            var variants = SeoMarkup.SellableVariants(p);
            var prices = variants.Select(v => v.Price).DefaultIfEmpty(p.DiscountPrice ?? p.BasePrice).ToList();
            var priceText = prices.Min() == prices.Max()
                ? SeoMarkup.FormatPrice(prices.Min())
                : $"{SeoMarkup.FormatPrice(prices.Min())} – {SeoMarkup.FormatPrice(prices.Max())}";
            bool? inStock = variants.Count == 0 ? null : variants.Any(v => SeoMarkup.SellableStock(v) > 0);

            var body = SeoMarkup.Heading(p.ProductName, description)
                + "<p>Price: " + SeoMarkup.E(priceText) + "</p>"
                + (inStock == null ? "" : "<p>Availability: " + (inStock.Value ? "In stock" : "Out of stock") + "</p>");
            if (categoryRoute?.Path != null)
            {
                body += SeoMarkup.LinkList(new[] { (categoryRoute.LinkText ?? categoryRoute.Breadcrumb ?? categoryRoute.Title, categoryRoute.Path) });
            }
            page.BodyHtml = SeoMarkup.NoScript(body);
            return page;
        }
    }
}
