using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hiya2.Server.Services;

namespace Hiya2.Server.Controllers
{
    public class CreatePaymentOrderDto
    {
        public long CustomerAddressId { get; set; }
        public string? CouponCode { get; set; }
        public int UseRewardCoins { get; set; } = 0;
        public string DeliveryType { get; set; } = "standard";
    }

    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        private long GetCurrentCustomerId()
        {
            var claimSub = User.FindFirstValue("CustomerId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            return long.TryParse(claimSub, out var id) ? id : 0;
        }

        [Authorize]
        [HttpPost("create-order")]
        public async Task<IActionResult> CreateOrder([FromBody] CreatePaymentOrderDto dto)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0) return Unauthorized();

            if (dto.CustomerAddressId <= 0)
            {
                return BadRequest(new { isSuccess = false, message = "Please select a delivery address." });
            }

            var result = await _paymentService.CreateRazorpayOrderAsync(customerId, dto.CustomerAddressId, dto.CouponCode, dto.UseRewardCoins, dto.DeliveryType);
            if (!result.IsSuccess)
            {
                return BadRequest(new { isSuccess = false, message = result.Message });
            }

            return Ok(new
            {
                isSuccess = true,
                razorpayOrderId = result.RazorpayOrderId,
                keyId = result.KeyId,
                amount = result.Amount,
                amountInPaise = result.AmountInPaise,
                currency = result.Currency
            });
        }

        [Authorize]
        [HttpPost("verify")]
        public async Task<IActionResult> VerifyAndCreateOrder([FromBody] RazorpayVerifyRequest request)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0) return Unauthorized();

            if (string.IsNullOrWhiteSpace(request.RazorpayOrderId) ||
                string.IsNullOrWhiteSpace(request.RazorpayPaymentId) ||
                string.IsNullOrWhiteSpace(request.RazorpaySignature))
            {
                return BadRequest(new { isSuccess = false, message = "Incomplete payment verification payload." });
            }

            var result = await _paymentService.ProcessSuccessfulOnlineOrderAsync(customerId, request);
            if (!result.IsSuccess)
            {
                return BadRequest(new { isSuccess = false, message = result.Message });
            }

            return Ok(new
            {
                isSuccess = true,
                message = "Payment verified and order placed successfully!",
                orderId = result.OrderId,
                orderNumber = result.OrderNumber,
                subtotal = result.Subtotal,
                discountAmount = result.DiscountAmount,
                coinDiscountAmount = result.CoinDiscountAmount,
                deliveryFee = result.DeliveryFee,
                totalAmount = result.TotalAmount
            });
        }
    }
}
