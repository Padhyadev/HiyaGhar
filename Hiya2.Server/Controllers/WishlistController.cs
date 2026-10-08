using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hiya2.Server.Repositories.Wishlist;

namespace Hiya2.Server.Controllers
{
    public class WishlistItemRequestDto
    {
        public int ProductId { get; set; }
        public int? VariantId { get; set; }
        public string? PackingType { get; set; }
    }

    public class WishlistMergeRequestDto
    {
        public List<WishlistItemRequestDto> Items { get; set; } = new();
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WishlistController : ControllerBase
    {
        private readonly IWishlistRepository _repository;

        public WishlistController(IWishlistRepository repository)
        {
            _repository = repository;
        }

        private long GetCurrentCustomerId()
        {
            var claimSub = User.FindFirstValue("CustomerId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            return long.TryParse(claimSub, out var id) ? id : 0;
        }

        [HttpGet]
        public async Task<IActionResult> GetWishlist()
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0) return Unauthorized();

            var lines = await _repository.GetWishlistAsync(customerId);

            return Ok(new
            {
                isSuccess = true,
                items = lines.Select(l => new
                {
                    id = l.Item.Id,
                    productId = l.Product.Id,
                    productName = l.Product.ProductName,
                    imagePath = l.Product.MainImagePath,
                    variantId = l.Variant?.Id,
                    variantName = l.Variant?.VariantName,
                    packingType = l.Item.PackingType,
                    price = l.Variant?.Price ?? l.Product.DiscountPrice ?? l.Product.BasePrice,
                    originalPrice = l.Variant?.OriginalPrice ?? l.Product.BasePrice
                })
            });
        }

        [HttpPost("add")]
        public async Task<IActionResult> Add([FromBody] WishlistItemRequestDto dto)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0) return Unauthorized();

            if (dto.ProductId <= 0)
            {
                return BadRequest(new { isSuccess = false, message = "A valid product is required." });
            }

            await _repository.AddAsync(customerId, dto.ProductId, dto.VariantId, dto.PackingType);
            return Ok(new { isSuccess = true, message = "Added to wishlist." });
        }

        [HttpPost("remove")]
        public async Task<IActionResult> Remove([FromBody] WishlistItemRequestDto dto)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0) return Unauthorized();

            await _repository.RemoveAsync(customerId, dto.ProductId, dto.VariantId, dto.PackingType);
            return Ok(new { isSuccess = true, message = "Removed from wishlist." });
        }

        [HttpPost("merge")]
        public async Task<IActionResult> Merge([FromBody] WishlistMergeRequestDto dto)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0) return Unauthorized();

            var lines = dto.Items
                .Where(i => i.ProductId > 0)
                .Select(i => (i.ProductId, i.VariantId, i.PackingType))
                .ToList();

            var merged = await _repository.MergeGuestWishlistAsync(customerId, lines);
            return Ok(new { isSuccess = true, merged });
        }
    }
}
