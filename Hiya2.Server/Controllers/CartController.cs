using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hiya2.Server.Repositories.Cart;
using Hiya2.Server.Services;

namespace Hiya2.Server.Controllers
{
    public class CartItemRequestDto
    {
        public int ProductId { get; set; }
        public int? VariantId { get; set; }
        public string? PackingType { get; set; }
        public int Quantity { get; set; } = 1;
    }

    public class CartMergeRequestDto
    {
        public List<CartItemRequestDto> Items { get; set; } = new();
    }

    public class CouponPreviewRequestDto
    {
        public string Code { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly ICartRepository _cartRepository;
        private readonly ICouponService _couponService;

        public CartController(ICartRepository cartRepository, ICouponService couponService)
        {
            _cartRepository = cartRepository;
            _couponService = couponService;
        }

        private long GetCurrentCustomerId()
        {
            var claimSub = User.FindFirstValue("CustomerId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            return long.TryParse(claimSub, out var id) ? id : 0;
        }

        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0) return Unauthorized();

            var lines = await _cartRepository.GetCartAsync(customerId);
            var subtotal = lines.Sum(l => l.LineTotal);

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
                    quantity = l.Item.Quantity,
                    unitPrice = l.UnitPrice,
                    lineTotal = l.LineTotal
                }),
                subtotal
            });
        }

        [HttpPost("items")]
        public async Task<IActionResult> AddOrUpdateItem([FromBody] CartItemRequestDto dto)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0) return Unauthorized();

            if (dto.ProductId <= 0)
            {
                return BadRequest(new { isSuccess = false, message = "A valid product is required." });
            }

            var result = await _cartRepository.AddOrUpdateItemAsync(customerId, dto.ProductId, dto.VariantId, dto.PackingType, dto.Quantity);
            if (!result.IsSuccess)
            {
                return BadRequest(new { isSuccess = false, message = result.Message ?? "Could not update cart." });
            }

            var lines = await _cartRepository.GetCartAsync(customerId);

            return Ok(new { isSuccess = true, message = "Cart updated.", count = lines.Sum(l => l.Item.Quantity) });
        }

        [HttpDelete("items/{id}")]
        public async Task<IActionResult> RemoveItem(long id)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0) return Unauthorized();

            var removed = await _cartRepository.RemoveItemAsync(customerId, id);
            if (!removed)
            {
                return NotFound(new { isSuccess = false, message = "Cart item not found." });
            }

            return Ok(new { isSuccess = true, message = "Item removed from cart." });
        }

        [HttpPost("merge")]
        public async Task<IActionResult> MergeGuestCart([FromBody] CartMergeRequestDto dto)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0) return Unauthorized();

            var lines = dto.Items
                .Where(i => i.ProductId > 0 && i.Quantity > 0)
                .Select(i => (i.ProductId, i.VariantId, i.PackingType, i.Quantity))
                .ToList();

            var merged = await _cartRepository.MergeGuestCartAsync(customerId, lines);
            return Ok(new { isSuccess = true, merged });
        }

        [HttpPost("coupon/preview")]
        public async Task<IActionResult> PreviewCoupon([FromBody] CouponPreviewRequestDto dto)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0) return Unauthorized();

            var subtotal = await _cartRepository.GetSubtotalAsync(customerId);
            var result = await _couponService.ValidateAsync(dto.Code, customerId, subtotal);

            return Ok(new
            {
                isSuccess = result.IsValid,
                message = result.Message,
                discountAmount = result.DiscountAmount,
                subtotal
            });
        }
    }
}
