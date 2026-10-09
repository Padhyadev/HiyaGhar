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

        public SitemapController(DataContext context, SeoContentStore seo)
        {
            _context = context;
            _seo = seo;
        }

        /// <summary>
        /// Fixed pages come from wwwroot/seo/routes.json (entries with "sitemap": true - no redirects,
        /// no noindex pages such as cart/checkout/login/profile/track-order). Their lastmod is the
        /// publish date (timestamp of wwwroot/index.html), so it only changes on a new deploy.
        /// Products: active, non-deleted; lastmod = LastModifiedDate, else CreatedDate.
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

            var products = await _context.Products
                .AsNoTracking()
                .Where(p => !p.IsDeleted && p.IsActive)
                .OrderBy(p => p.Id)
                .Select(p => new { p.Id, p.LastModifiedDate, p.CreatedDate })
                .ToListAsync();

            foreach (var prod in products)
            {
                AppendUrl(sb, $"{siteUrl}/product/{prod.Id}", prod.LastModifiedDate ?? prod.CreatedDate, "0.7");
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
