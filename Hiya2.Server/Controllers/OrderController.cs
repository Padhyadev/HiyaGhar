using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;
using Hiya2.Server.Services;

namespace Hiya2.Server.Controllers
{
    public class CheckoutRequestDto
    {
        public long CustomerAddressId { get; set; }
        public string? CouponCode { get; set; }
        public int UseRewardCoins { get; set; } = 0;
    }

    public class CancelOrderRequestDto
    {
        public string Reason { get; set; } = string.Empty;
    }

    public class UpdateOrderStatusRequestDto
    {
        public OrderStatus Status { get; set; }
        public string? Reason { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly DataContext _context;

        public OrderController(IOrderService orderService, DataContext context)
        {
            _orderService = orderService;
            _context = context;
        }

        private long GetCurrentCustomerId()
        {
            var claimSub = User.FindFirstValue("CustomerId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            return long.TryParse(claimSub, out var id) ? id : 0;
        }

        // Fetches the "OrderStatus" LOV labels once per request so a list of
        // orders doesn't run one lookup query per row.
        private async Task<Dictionary<string, string>> GetOrderStatusLabelsAsync()
        {
            return await _context.LovMasters
                .Where(l => l.LovColumn == "OrderStatus" && l.IsActive && !l.IsDeleted)
                .ToDictionaryAsync(l => l.LovCode, l => l.LovDesc);
        }

        private static object ToOrderDto(Order o, Dictionary<string, string> statusLabels) => new
        {
            id = o.Id,
            orderNumber = o.OrderNumber,
            orderDate = o.OrderDate,
            subtotal = o.Subtotal,
            discountAmount = o.DiscountAmount,
            couponCode = o.CouponCode,
            coinsUsed = o.CoinsUsed,
            coinDiscountAmount = o.CoinDiscountAmount,
            deliveryFee = o.DeliveryFee,
            totalAmount = o.TotalAmount,
            orderStatus = o.OrderStatus.ToString(),
            orderStatusDisplay = statusLabels.TryGetValue(o.OrderStatus.ToString(), out var label) ? label : o.OrderStatus.ToString(),
            paymentStatus = o.PaymentStatus.ToString(),
            paymentMode = o.PaymentMode,
            recipientName = o.RecipientName,
            addressLine1 = o.AddressLine1,
            addressLine2 = o.AddressLine2,
            city = o.City,
            state = o.State,
            postalCode = o.PostalCode,
            country = o.Country,
            mobileNo = o.MobileNo,
            cancelReason = o.CancelReason,
            cancelledDate = o.CancelledDate,
            items = o.Items.Select(i => new
            {
                i.Id,
                i.ProductId,
                i.VariantId,
                i.ProductName,
                i.VariantName,
                i.UnitPrice,
                i.Quantity,
                i.TotalPrice
            })
        };

        [Authorize]
        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CheckoutRequestDto dto)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0) return Unauthorized();

            if (dto.CustomerAddressId <= 0)
            {
                return BadRequest(new { isSuccess = false, message = "Please select a delivery address." });
            }

            var result = await _orderService.CreateOrderFromCartAsync(customerId, dto.CustomerAddressId, dto.CouponCode, dto.UseRewardCoins);

            if (!result.IsSuccess)
            {
                return BadRequest(new { isSuccess = false, message = result.Message });
            }

            return Ok(new
            {
                isSuccess = true,
                message = result.Message,
                orderId = result.OrderId,
                orderNumber = result.OrderNumber,
                subtotal = result.Subtotal,
                discountAmount = result.DiscountAmount,
                coinDiscountAmount = result.CoinDiscountAmount,
                deliveryFee = result.DeliveryFee,
                totalAmount = result.TotalAmount
            });
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetMyOrders()
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0) return Unauthorized();

            var orders = await _orderService.GetOrdersByCustomerAsync(customerId);
            var statusLabels = await GetOrderStatusLabelsAsync();
            return Ok(new { isSuccess = true, orders = orders.Select(o => ToOrderDto(o, statusLabels)) });
        }

        [Authorize]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0) return Unauthorized();

            var order = await _orderService.GetOrderByIdAsync(id, customerId);
            if (order == null)
            {
                return NotFound(new { isSuccess = false, message = "Order not found." });
            }

            var statusLabels = await GetOrderStatusLabelsAsync();
            return Ok(new { isSuccess = true, order = ToOrderDto(order, statusLabels) });
        }

        [Authorize]
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> Cancel(long id, [FromBody] CancelOrderRequestDto dto)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0) return Unauthorized();

            var result = await _orderService.CancelOrderAsync(id, customerId, dto.Reason);
            if (!result.IsSuccess)
            {
                return BadRequest(new { isSuccess = false, message = result.Message });
            }

            return Ok(new { isSuccess = true, message = result.Message });
        }

        // --- Admin ---

        [Authorize]
        [HttpGet("admin")]
        public async Task<IActionResult> GetAllAdmin([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var orders = await _orderService.GetAllOrdersAdminAsync(page, pageSize);
            var statusLabels = await GetOrderStatusLabelsAsync();
            return Ok(new { isSuccess = true, orders = orders.Select(o => ToOrderDto(o, statusLabels)) });
        }

        [Authorize]
        [HttpPost("admin/{id}/status")]
        public async Task<IActionResult> UpdateStatusAdmin(long id, [FromBody] UpdateOrderStatusRequestDto dto)
        {
            long? changedBy = null;
            if (User.FindFirstValue("token_type") == "staff")
            {
                var claimSub = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (long.TryParse(claimSub, out var staffId) && staffId > 0)
                {
                    changedBy = staffId;
                }
            }

            var result = await _orderService.UpdateOrderStatusAsync(id, dto.Status, dto.Reason, changedBy);
            if (!result.IsSuccess)
            {
                return BadRequest(new { isSuccess = false, message = result.Message });
            }

            return Ok(new { isSuccess = true, message = result.Message });
        }
    }
}
