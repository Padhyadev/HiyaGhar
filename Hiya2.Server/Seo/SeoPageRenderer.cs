using HIyaghar.Infra;
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
    /// as the public API. Rendered pages are cached per path for 5 minutes, and dropped straight
    /// away after any catalog change (the key includes Services/CatalogCache.Version).
    /// </summary>
    public class SeoPageRenderer
    {
        private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

        private readonly SeoContentStore _store;
        private readonly IProductRepository _products;
        private readonly DataContext _db;
        private readonly IMemoryCache _cache;

        public SeoPageRenderer(SeoContentStore store, IProductRepository products, DataContext db, IMemoryCache cache)
        {
            _store = store;
            _products = products;
            _db = db;
            _cache = cache;
        }

        public async Task<SeoRenderResult> RenderAsync(string path)
        {
            var snapshot = _store.Get();
            // Case-sensitive key: "/product/Foo" (301) and "/product/foo" (200) must not share an entry.
            var key = $"seo-page:{snapshot.Version}:{Hiya2.Server.Services.CatalogCache.Version}:{path}";
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
            return (await _cache.GetOrCreateAsync($"seo-product-paths:{Hiya2.Server.Services.CatalogCache.Version}", async entry =>
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
                page = BuildProductPage(product, found.Path, c, s.DefaultImage, baseNodes, await VerifiedReviewsAsync(found.Id));
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

            if (route.CategoryId.HasValue || route.Collection == "giftHampers" || route.Collection == "combos")
            {
                var paths = await GetProductPathsAsync();
                string PathOf(Models.Product p) => paths.TryGetValue(p.Id, out var path) ? path : "/product/" + p.Id;

                // Combos live in the "Combos" category, whose id is only known once the admin created it.
                var categoryId = route.CategoryId ?? (route.Collection == "combos"
                    ? await _db.Categories.AsNoTracking()
                        .Where(cat => !cat.IsDeleted && cat.CategoryName == Services.ComboPricing.CategoryName)
                        .Select(cat => (int?)cat.Id).FirstOrDefaultAsync()
                    : null);

                // The gift builder (/gift-hampers) offers every product except combo packs.
                var source = route.Collection == "giftHampers"
                    ? (await _products.GetAllAsync()).Where(p => p.Category?.CategoryName != Services.ComboPricing.CategoryName)
                    : categoryId.HasValue ? await _products.GetAllAsync(categoryId.Value) : Enumerable.Empty<Models.Product>();
                var items = source
                    .Where(p => p.IsActive && !p.IsDeleted)
                    .Select(p => (p.ProductName, PathOf(p))).ToList();

                // Same wording as the page's result count ("Showing 7 Mukhwas products", "Showing 8 products").
                var label = route.CategoryId.HasValue && route.Breadcrumb != null ? route.Breadcrumb + " " : "";
                body += "<p>" + SeoMarkup.E($"Showing {items.Count} {label}product{(items.Count == 1 ? "" : "s")}") + "</p>";
                body += SeoMarkup.LinkList(items);
                if (pageNode != null) pageNode["mainEntity"] = SeoMarkup.ItemList(c, items);

                // Category guide + FAQs from routes.json (nothing until text is added there).
                body += SeoMarkup.GuideSection(route.Guide);
                var guideFaqs = SeoMarkup.GuideContent(route.Guide).Faqs;
                if (guideFaqs.Count > 0) page.JsonLd.Add(SeoMarkup.FaqPageNode(c, route.Path!, guideFaqs));
                page.JsonLd.Add(SeoMarkup.Breadcrumbs(c, new[] { ("Home", "/"), (route.Breadcrumb ?? route.H1 ?? route.Title, route.Path!) }));
            }

            if (route.SchemaType == "FAQPage")
            {
                // Same query as FaqController.GetPublicFaqs - the text the FAQ page renders.
                var faqs = await _db.Faqs.AsNoTracking()
                    .Where(f => !f.IsDeleted && f.IsActive)
                    .OrderBy(f => f.DisplayOrder).ThenBy(f => f.Id)
                    .Select(f => new { f.Category, f.Question, f.Answer })
                    .ToListAsync();

                // One list, grouped like the React page (src/pages/Faq/FaqPage.tsx): the visible
                // headings/answers and the FAQPage JSON-LD are both built from it, in the same order.
                var groups = SeoMarkup.GroupFaqs(c.FaqCategories, faqs.Select(f => (f.Category, f.Question, f.Answer)));
                if (pageNode != null)
                {
                    pageNode["mainEntity"] = groups.SelectMany(g => g.Faqs).Select(f => new Dictionary<string, object?>
                    {
                        ["@type"] = "Question",
                        ["name"] = f.Question,
                        ["acceptedAnswer"] = new Dictionary<string, object?> { ["@type"] = "Answer", ["text"] = f.Answer },
                    }).ToList();
                }
                body += SeoMarkup.FaqSections(groups);
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

        /// <summary>Active reviews of the product written by customers who received it (newest first).</summary>
        private async Task<List<SeoMarkup.ProductReview>> VerifiedReviewsAsync(int productId)
        {
            var reviews = await _db.Reviews.AsNoTracking()
                .Include(r => r.Customer)
                .Where(r => r.ProductId == productId && r.IsActive && !r.IsDeleted)
                .OrderByDescending(r => r.CreatedDate)
                .ToListAsync();
            var verified = await Services.ReviewVerification.VerifiedReviewIdsAsync(_db, reviews);
            return reviews.Where(r => verified.Contains(r.Id))
                .Select(r => new SeoMarkup.ProductReview(Services.ReviewVerification.DisplayName(r.Customer), r.Rating, r.ReviewText, r.CreatedDate))
                .ToList();
        }

        private static SeoPage BuildProductPage(Models.Product p, string path, SeoConfig c, string defaultImage, List<object> baseNodes, List<SeoMarkup.ProductReview> verifiedReviews)
        {
            var description = SeoMarkup.ProductDescription(p, c.ProductDescriptionTemplate);
            var images = SeoMarkup.ProductImages(c, p, defaultImage);
            var categoryRoute = c.Routes.FirstOrDefault(r => r.CategoryId == p.CategoryId);

            var page = new SeoPage
            {
                Title = SeoMarkup.ProductTitle(p.ProductName, p.Category?.CategoryName, c.SiteName),
                Description = description,
                Path = path,
                Image = images[0],
                OgType = "product",
                JsonLd = new List<object>(baseNodes) { SeoMarkup.ProductNode(c, p, description, images, path, verifiedReviews) },
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

            // Combo (Services/ComboPricing.cs): what is in the box and what the items cost separately.
            var comboItems = Services.ComboPricing.ParseItems(p.FullDescription);
            if (comboItems.Count > 0)
            {
                body += "<h2>This combo includes</h2><ul>" + string.Concat(comboItems.Select(i =>
                    "<li>" + SeoMarkup.E($"{i.Quantity} × {i.Name}" + (i.Variant.Length > 0 ? $" ({i.Variant})" : "")) + "</li>")) + "</ul>";
                var worth = variants.Select(v => v.OriginalPrice).FirstOrDefault(o => o.HasValue && o > prices.Min());
                if (worth.HasValue) body += "<p>" + SeoMarkup.E($"Items bought separately: {SeoMarkup.FormatPrice(worth.Value)}") + "</p>";
                var combosRoute = c.Routes.FirstOrDefault(r => r.Collection == "combos");
                if (combosRoute?.Path != null) body += SeoMarkup.LinkList(new[] { (combosRoute.LinkText ?? combosRoute.Title, combosRoute.Path) });
            }

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
            // Verified-buyer reviews: the same ones (and the same average) as the Product aggregateRating.
            if (verifiedReviews.Count > 0)
            {
                var avg = Math.Round(verifiedReviews.Average(r => r.Rating), 1).ToString("0.#", System.Globalization.CultureInfo.InvariantCulture);
                body += "<h2>Customer Reviews</h2><p>" + SeoMarkup.E($"Rated {avg} out of 5 from {verifiedReviews.Count} verified buyer review{(verifiedReviews.Count == 1 ? "" : "s")}") + "</p><ul>"
                    + string.Concat(verifiedReviews.Take(5).Select(r => "<li><strong>" + SeoMarkup.E(r.Author) + "</strong> – " + r.Rating + "/5 – " + SeoMarkup.E(r.Text) + "</li>")) + "</ul>";
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
