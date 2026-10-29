using System.Text;
using Microsoft.AspNetCore.Mvc;
using Hiya2.Server.Repositories.Product;
using Hiya2.Server.Seo;

namespace Hiya2.Server.Controllers
{
    [ApiController]
    public class FeedController : ControllerBase
    {
        private readonly IProductRepository _products;
        private readonly SeoContentStore _seo;
        private readonly SeoPageRenderer _renderer;

        public FeedController(IProductRepository products, SeoContentStore seo, SeoPageRenderer renderer)
        {
            _products = products;
            _seo = seo;
            _renderer = renderer;
        }

        /// <summary>
        /// Google Merchant Center product feed (see Seo/MerchantFeed.cs). Add this URL as a
        /// scheduled fetch in Merchant Center: https://hiyaghar.com/feeds/google-products.xml
        /// </summary>
        [HttpGet("feeds/google-products.xml")]
        [HttpHead("feeds/google-products.xml")]
        [Produces("application/xml")]
        public async Task<IActionResult> GetGoogleProducts()
        {
            var products = await _products.GetAllAsync(onlyActive: true);
            var paths = await _renderer.GetProductPathsAsync();
            var xml = MerchantFeed.Build(products, _seo.Get().Config, paths);
            return Content(xml, "application/xml", Encoding.UTF8);
        }
    }
}
