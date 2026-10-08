using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;

namespace Hiya2.Server.Controllers
{
    [ApiController]
    public class SitemapController : ControllerBase
    {
        private readonly DataContext _context;

        public SitemapController(DataContext context)
        {
            _context = context;
        }

        [HttpGet("sitemap.xml")]
        [Produces("application/xml")]
        public async Task<IActionResult> GetSitemap()
        {
            var baseUrl = $"{Request.Scheme}://{Request.Host}";

            var sb = new StringBuilder();
            sb.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
            sb.AppendLine("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");

            // Static Pages
            var staticRoutes = new[]
            {
                "",
                "/mukhwas",
                "/tea-masala",
                "/handmade-soap",
                "/hair-oil",
                "/gift-hampers",
                "/combo",
                "/our-story",
                "/privacy-policy",
                "/terms-conditions",
                "/refund-policy",
                "/shipping-policy",
                "/contact-us"
            };

            foreach (var route in staticRoutes)
            {
                sb.AppendLine("  <url>");
                sb.AppendLine($"    <loc>{baseUrl}{route}</loc>");
                sb.AppendLine("    <changefreq>weekly</changefreq>");
                sb.AppendLine($"    <priority>{(route == "" ? "1.0" : "0.8")}</priority>");
                sb.AppendLine("  </url>");
            }

            // Active Products
            var products = await _context.Products
                .AsNoTracking()
                .Where(p => !p.IsDeleted && p.IsActive)
                .Select(p => new { p.Id, p.ProductName })
                .ToListAsync();

            foreach (var prod in products)
            {
                sb.AppendLine("  <url>");
                sb.AppendLine($"    <loc>{baseUrl}/product/{prod.Id}</loc>");
                sb.AppendLine("    <changefreq>weekly</changefreq>");
                sb.AppendLine("    <priority>0.7</priority>");
                sb.AppendLine("  </url>");
            }

            sb.AppendLine("</urlset>");

            return Content(sb.ToString(), "application/xml", Encoding.UTF8);
        }
    }
}
