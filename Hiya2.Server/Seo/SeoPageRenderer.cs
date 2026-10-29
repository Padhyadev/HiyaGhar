using HIyaghar.Infra;
using Hiya2.Server.Repositories.GiftHamper;
using Hiya2.Server.Repositories.Product;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Hiya2.Server.Seo
{
    /// <summary>Html is null for a redirect (Location set) or when there is no built index.html.</summary>
    public record SeoRenderResult(int StatusCode, string? Html, string? Location = null);

    /// <summary>
    /// Serves the SPA shell with per-route SEO tags and crawlable pre-render content injected.
    /// Status: 200 for routes in seo/routes.json and for active products at their canonical
    /// /product/{slug} path, 301 from /product/{id} (and other non-canonical product paths) to it,
    /// 404 otherwise (the React app still renders its 404 view). Uses the same repositories/queries
    /// as the public API. Rendered pages are cached per path for 5 minutes (there is no
    /// product-change hook to evict on).
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
            // Case-sensitive key: "/product/Foo" (301) and "/product/foo" (200) must not share an entry.
            var key = $"seo-page:{snapshot.Version}:{path}";
            if (_cache.TryGetValue(key, out SeoRenderResult? cached) && cached != null) return cached;

            var result = await BuildResultAsync(path, snapshot);
            _cache.Set(key, result, CacheDuration);
            return result;
        }

        /// <summary>
        /// Canonical path for every active product (see SeoMarkup.ProductPaths); shared with the
        /// sitemap. Cached for the same 5 minutes as rendered pages.
        /// </summary>
        public async Task<Dictionary<int, string>> GetProductPathsAsync()
        {
            return (await _cache.GetOrCreateAsync("seo-product-paths", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = CacheDuration;
                var products = await _db.Products.AsNoTracking()
                    .Where(p => p.IsActive && !p.IsDeleted)
                    .Select(p => new { p.Id, p.ProductName })
                    .ToListAsync();
                return SeoMarkup.ProductPaths(products.Select(p => (p.Id, (string?)p.ProductName)));
            }))!;
        }

        private async Task<SeoRenderResult> BuildResultAsync(string path, SeoContentStore.Snapshot s)
        {
            var c = s.Config;
            var baseNodes = new List<object> { SeoMarkup.Organization(c), SeoMarkup.WebSite(c) };
            SeoPage page;

            var route = c.FindRoute(path);
            if (route != null)
            {
                page = NewPage(route, path, s.DefaultImage, baseNodes);
                await AddRouteContentAsync(route, page, c);
            }
            else if (path.StartsWith("/product/", StringComparison.OrdinalIgnoreCase)
                && await FindProductIdAsync(path["/product/".Length..]) is { } found)
            {
                // Numeric ids, and slugs in another case, get one 301 to the canonical path.
                if (!string.Equals(path, found.Path, StringComparison.Ordinal))
                {
                    return new SeoRenderResult(StatusCodes.Status301MovedPermanently, null, found.Path);
                }
                var product = await _products.GetByIdAsync(found.Id);
                if (product == null) return NotFoundResult(path, s, baseNodes);
                page = BuildProductPage(product, found.Path, c, s.DefaultImage, baseNodes);
            }
            else if (path.StartsWith(SeoMarkup.OccasionPathPrefix, StringComparison.OrdinalIgnoreCase))
            {
                var slug = path[SeoMarkup.OccasionPathPrefix.Length..];
                var occasion = (await _hampers.GetAllOccasionsAsync(true))
                    .FirstOrDefault(o => !string.IsNullOrWhiteSpace(o.Slug) && string.Equals(o.Slug.Trim(), slug, StringComparison.OrdinalIgnoreCase));
                if (occasion == null) return NotFoundResult(path, s, baseNodes);

                var canonical = SeoMarkup.OccasionPath(occasion.Slug);
                if (!string.Equals(path, canonical, StringComparison.Ordinal))
                {
                    return new SeoRenderResult(StatusCodes.Status301MovedPermanently, null, canonical);
                }
                page = await BuildOccasionPageAsync(occasion, canonical, c, s.DefaultImage, baseNodes);
            }
            else
            {
                return NotFoundResult(path, s, baseNodes);
            }

            return new SeoRenderResult(StatusCodes.Status200OK, Html(s, page));
        }

        /// <summary>Active product for a /product/{segment} URL: by id, else by slug.</summary>
        private async Task<(int Id, string Path)?> FindProductIdAsync(string segment)
        {
            var paths = await GetProductPathsAsync();
            if (int.TryParse(segment, out var id))
            {
                return paths.TryGetValue(id, out var p) ? (id, p) : null;
            }
            var wanted = "/product/" + segment.ToLowerInvariant();
            foreach (var kv in paths)
            {
                if (kv.Value == wanted) return (kv.Key, kv.Value);
            }
            return null;
        }

        private static string? Html(SeoContentStore.Snapshot s, SeoPage page) => s.IndexHtml == null
            ? null
            : SeoMarkup.Inject(s.IndexHtml, SeoMarkup.BuildHead(page, s.Config), page.BodyHtml);

        private static SeoRenderResult NotFoundResult(string path, SeoContentStore.Snapshot s, List<object> baseNodes)
        {
            var c = s.Config;
            var notFound = NewPage(c.NotFound, path, s.DefaultImage, baseNodes);
            notFound.Noindex = true;
            notFound.BodyHtml = SeoMarkup.Prerender(SeoMarkup.Heading(c.NotFound.H1, c.NotFound.Intro)
                + SeoMarkup.LinkList(new[] { ("Back to Home", "/") }));
            return new SeoRenderResult(StatusCodes.Status404NotFound, Html(s, notFound));
        }

        private static SeoPage NewPage(SeoRoute route, string path, string defaultImage, List<object> baseNodes) => new()
        {
            Title = route.Title,
            Description = route.Description,
            Path = path,
            Image = defaultImage,
            Noindex = route.Noindex,
            JsonLd = new List<object>(baseNodes),
            BodyHtml = SeoMarkup.Prerender(SeoMarkup.Heading(route.H1, route.Intro)),
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
                var paths = await GetProductPathsAsync();
                string PathOf(Models.Product p) => paths.TryGetValue(p.Id, out var path) ? path : "/product/" + p.Id;
                var occasions = route.CategoryId.HasValue ? new List<Models.GiftHamperOccasion>() : await _hampers.GetAllOccasionsAsync(true);
                var occasionLinks = occasions.Where(o => !string.IsNullOrWhiteSpace(o.Slug))
                    .Select(o => (o.Name.Trim(), SeoMarkup.OccasionPath(o.Slug))).ToList();
                if (occasionLinks.Count > 0) body += SeoMarkup.LinkList(occasionLinks);

                var items = route.CategoryId.HasValue
                    ? (await _products.GetAllAsync(route.CategoryId.Value))
                        .Where(p => p.IsActive && !p.IsDeleted)
                        .Select(p => (p.ProductName, PathOf(p))).ToList()
                    : occasions
                        .SelectMany(o => o.Products.Where(op => op.Product != null).OrderBy(op => op.DisplayOrder))
                        .Select(op => op.Product!)
                        .Where(p => p.IsActive && !p.IsDeleted)
                        .GroupBy(p => p.Id).Select(g => g.First())
                        .Select(p => (p.ProductName, PathOf(p))).ToList();

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
                var address = string.Join(", ", new[] { o.StreetAddress, o.AddressLocality, o.PostalCode, o.AddressRegion, "India" }.Where(x => !string.IsNullOrWhiteSpace(x)));
                body += "<ul><li>" + SeoMarkup.E(o.Telephone) + "</li><li><a href=\"mailto:" + SeoMarkup.E(o.Email) + "\">" + SeoMarkup.E(o.Email)
                    + "</a></li><li>" + SeoMarkup.E(address) + "</li></ul>";
            }

            if (route.LocalBusiness) page.JsonLd.Add(SeoMarkup.LocalBusiness(c));

            // Our Story: the page is about the founder (the Person node is nested in Organization).
            if (route.SchemaType == "AboutPage" && pageNode != null && c.Organization.Founder != null)
            {
                pageNode["mainEntity"] = new Dictionary<string, object?> { ["@id"] = c.SiteUrl + "/#founder" };
                pageNode["about"] = new Dictionary<string, object?> { ["@id"] = c.SiteUrl + "/#organization" };
            }

            if (!route.HomeLinks && route.Path != "/")
            {
                body += SeoMarkup.LinkList(new[] { ("Home", "/") });
            }

            if (pageNode != null) page.JsonLd.Add(pageNode);
            page.BodyHtml = SeoMarkup.Prerender(body);
        }

        /// <summary>One gift hamper occasion (/gift-hampers/{slug}): its products, breadcrumbs, CollectionPage.</summary>
        private async Task<SeoPage> BuildOccasionPageAsync(Models.GiftHamperOccasion o, string path, SeoConfig c, string defaultImage, List<object> baseNodes)
        {
            var paths = await GetProductPathsAsync();
            var items = o.Products
                .Where(op => op.Product != null && op.Product.IsActive && !op.Product.IsDeleted)
                .OrderBy(op => op.DisplayOrder)
                .Select(op => op.Product!)
                .GroupBy(p => p.Id).Select(g => g.First())
                .Select(p => (p.ProductName, paths.TryGetValue(p.Id, out var pp) ? pp : "/product/" + p.Id))
                .ToList();

            var hub = c.Routes.FirstOrDefault(r => r.Collection == "giftHampers");
            var page = new SeoPage
            {
                Title = SeoMarkup.OccasionTitle(o.Name, c.SiteName),
                Description = SeoMarkup.OccasionDescription(o.Name, o.Description),
                Path = path,
                Image = string.IsNullOrWhiteSpace(o.BannerImagePath) ? defaultImage : o.BannerImagePath!,
                JsonLd = new List<object>(baseNodes),
            };

            var pageNode = SeoMarkup.WebPageNode(c, "CollectionPage", page);
            pageNode["mainEntity"] = SeoMarkup.ItemList(c, items);
            page.JsonLd.Add(pageNode);
            var crumbs = new List<(string, string)> { ("Home", "/") };
            if (hub?.Path != null) crumbs.Add((hub.Breadcrumb ?? hub.H1 ?? hub.Title, hub.Path));
            crumbs.Add((o.Name.Trim(), path));
            page.JsonLd.Add(SeoMarkup.Breadcrumbs(c, crumbs));

            var body = SeoMarkup.Heading(o.Name.Trim(), page.Description)
                + "<p>" + SeoMarkup.E($"Showing {items.Count} product{(items.Count == 1 ? "" : "s")}") + "</p>"
                + SeoMarkup.LinkList(items);
            if (hub?.Path != null) body += SeoMarkup.LinkList(new[] { ("All " + (hub.LinkText ?? hub.Title), hub.Path) });
            page.BodyHtml = SeoMarkup.Prerender(body);
            return page;
        }

        private static SeoPage BuildProductPage(Models.Product p, string path, SeoConfig c, string defaultImage, List<object> baseNodes)
        {
            var description = SeoMarkup.ProductDescription(p, c.ProductDescriptionTemplate);
            var images = SeoMarkup.ProductImages(c, p, defaultImage);
            var categoryRoute = c.Routes.FirstOrDefault(r => r.CategoryId == p.CategoryId);

            var page = new SeoPage
            {
                Title = $"{p.ProductName} | {c.SiteName}",
                Description = description,
                Path = path,
                Image = images[0],
                OgType = "product",
                JsonLd = new List<object>(baseNodes) { SeoMarkup.ProductNode(c, p, description, images, path) },
            };

            var crumbs = new List<(string, string)> { ("Home", "/") };
            if (categoryRoute?.Path != null) crumbs.Add((categoryRoute.Breadcrumb ?? categoryRoute.H1 ?? categoryRoute.Title, categoryRoute.Path));
            crumbs.Add((p.ProductName, page.Path));
            page.JsonLd.Add(SeoMarkup.Breadcrumbs(c, crumbs));

            // Crawlable body: name, description, price(s), sizes, availability, full description,
            // saved ingredients/benefits, category link.
            var variants = SeoMarkup.SellableVariants(p);
            var prices = variants.Select(v => v.Price).DefaultIfEmpty(p.DiscountPrice ?? p.BasePrice).ToList();
            var priceText = prices.Min() == prices.Max()
                ? SeoMarkup.FormatPrice(prices.Min())
                : $"{SeoMarkup.FormatPrice(prices.Min())} – {SeoMarkup.FormatPrice(prices.Max())}";
            bool? inStock = variants.Count == 0 ? null : variants.Any(v => SeoMarkup.SellableStock(v) > 0);

            var body = SeoMarkup.Heading(p.ProductName, description)
                + "<p>Price: " + SeoMarkup.E(priceText) + "</p>"
                + (inStock == null ? "" : "<p>Availability: " + (inStock.Value ? "In stock" : "Out of stock") + "</p>");

            var sizes = variants.Where(v => SeoMarkup.VariantLabel(v).Length > 0).ToList();
            if (sizes.Count > 1)
            {
                body += "<h2>Sizes</h2><ul>" + string.Concat(sizes.Select(v => "<li>" + SeoMarkup.E(SeoMarkup.VariantLabel(v)) + ": "
                    + SeoMarkup.E(SeoMarkup.FormatPrice(v.Price)) + (SeoMarkup.SellableStock(v) > 0 ? "" : " (out of stock)") + "</li>")) + "</ul>";
            }

            var fullText = SeoMarkup.CleanText(p.FullDescription);
            if (fullText.Length > 0 && fullText != description)
            {
                body += "<h2>Description</h2><p>" + SeoMarkup.E(fullText) + "</p>";
            }

            var meta = SeoMarkup.ProductMeta(p.FullDescription);
            if (meta.HowToUse.Length > 0) body += "<h2>How to Use</h2><p>" + SeoMarkup.E(meta.HowToUse) + "</p>";
            if (meta.ShelfLife.Length > 0) body += "<p>Shelf life: " + SeoMarkup.E(meta.ShelfLife) + "</p>";
            if (meta.Ingredients.Count > 0) body += "<h2>Ingredients</h2><ul>" + string.Concat(meta.Ingredients.Select(x => "<li>" + SeoMarkup.E(x) + "</li>")) + "</ul>";
            if (meta.Benefits.Count > 0) body += "<h2>Benefits</h2><ul>" + string.Concat(meta.Benefits.Select(x => "<li>" + SeoMarkup.E(x) + "</li>")) + "</ul>";
            if (meta.Faqs.Count > 0)
            {
                body += "<h2>Frequently Asked Questions</h2><dl>"
                    + string.Concat(meta.Faqs.Select(f => "<dt>" + SeoMarkup.E(f.Question) + "</dt><dd>" + SeoMarkup.E(f.Answer) + "</dd>")) + "</dl>";
                page.JsonLd.Add(SeoMarkup.ProductFaqNode(c, path, meta.Faqs));
            }
            if (categoryRoute?.Path != null)
            {
                body += SeoMarkup.LinkList(new[] { (categoryRoute.LinkText ?? categoryRoute.Breadcrumb ?? categoryRoute.Title, categoryRoute.Path) });
            }
            page.BodyHtml = SeoMarkup.Prerender(body);
            return page;
        }
    }
}
