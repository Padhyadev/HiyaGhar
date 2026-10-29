using System.Globalization;
using System.Security;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Seo;

namespace Hiya2.Server.Controllers
{
    [ApiController]
    public class SitemapController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly SeoContentStore _seo;
        private readonly SeoPageRenderer _renderer;

        public SitemapController(DataContext context, SeoContentStore seo, SeoPageRenderer renderer)
        {
            _context = context;
            _seo = seo;
            _renderer = renderer;
        }

        /// <summary>
        /// Fixed pages come from wwwroot/seo/routes.json (entries with "sitemap": true - no redirects,
        /// no noindex pages such as cart/checkout/login/profile). Their lastmod is the
        /// publish date (timestamp of wwwroot/index.html), so it only changes on a new deploy.
        /// Products: active, non-deleted, at their canonical /product/{slug} path; lastmod = LastModifiedDate, else CreatedDate.
        /// </summary>
        [HttpGet("sitemap.xml")]
        [HttpHead("sitemap.xml")]
        [Produces("application/xml")]
        public async Task<IActionResult> GetSitemap()
        {
            var snapshot = _seo.Get();
            var config = snapshot.Config;
            var siteUrl = config.SiteUrl.TrimEnd('/');
            var publishDate = snapshot.IndexLastModified.UtcDateTime;

            var sb = new StringBuilder();
            sb.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
            sb.AppendLine("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");

            foreach (var route in config.Routes.Where(r => r.Sitemap && !r.Noindex && r.Path != null))
            {
                AppendUrl(sb, SeoMarkup.CanonicalUrl(siteUrl, route.Path!), publishDate, route.Path == "/" ? "1.0" : "0.8");
            }

            // Gift hamper occasion pages (/gift-hampers/{slug}), active only.
            var occasions = await _context.GiftHamperOccasions
                .AsNoTracking()
                .Where(o => !o.IsDeleted && o.IsActive && o.Slug != "")
                .OrderBy(o => o.DisplayOrder)
                .Select(o => new { o.Slug, o.LastModifiedDate, o.CreatedDate })
                .ToListAsync();
            foreach (var occ in occasions)
            {
                AppendUrl(sb, SeoMarkup.CanonicalUrl(siteUrl, SeoMarkup.OccasionPath(occ.Slug)), occ.LastModifiedDate ?? occ.CreatedDate, "0.7");
            }

            var products = await _context.Products
                .AsNoTracking()
                .Where(p => !p.IsDeleted && p.IsActive)
                .OrderBy(p => p.Id)
                .Select(p => new { p.Id, p.LastModifiedDate, p.CreatedDate })
                .ToListAsync();

            var paths = await _renderer.GetProductPathsAsync();
            foreach (var prod in products)
            {
                var path = paths.TryGetValue(prod.Id, out var p) ? p : "/product/" + prod.Id;
                AppendUrl(sb, SeoMarkup.CanonicalUrl(siteUrl, path), prod.LastModifiedDate ?? prod.CreatedDate, "0.7");
            }

            sb.AppendLine("</urlset>");

            return Content(sb.ToString(), "application/xml", Encoding.UTF8);
        }

        private static void AppendUrl(StringBuilder sb, string loc, DateTime lastModified, string priority)
        {
            sb.AppendLine("  <url>");
            sb.AppendLine($"    <loc>{SecurityElement.Escape(loc)}</loc>");
            sb.AppendLine($"    <lastmod>{lastModified.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)}</lastmod>");
            sb.AppendLine("    <changefreq>weekly</changefreq>");
            sb.AppendLine($"    <priority>{priority}</priority>");
            sb.AppendLine("  </url>");
        }
    }
}
