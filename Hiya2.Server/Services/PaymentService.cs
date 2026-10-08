using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using HIyaghar.Infra;
using Hiya2.Server.Models;
using Hiya2.Server.Repositories.Cart;
using Microsoft.EntityFrameworkCore;

namespace Hiya2.Server.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IConfiguration _configuration;
        private readonly IOrderService _orderService;
        private readonly ICartRepository _cartRepository;
        private readonly ICouponService _couponService;
        private readonly IRewardService _rewardService;
        private readonly DataContext _context;
        private readonly HttpClient _httpClient;

        public PaymentService(
            IConfiguration configuration,
            IOrderService orderService,
            ICartRepository cartRepository,
            ICouponService couponService,
            IRewardService rewardService,
            DataContext context)
        {
            _configuration = configuration;
            _orderService = orderService;
            _cartRepository = cartRepository;
            _couponService = couponService;
            _rewardService = rewardService;
            _context = context;
            _httpClient = new HttpClient();
        }

        private (string KeyId, string KeySecret) GetRazorpayCredentials()
        {
            var keyId = _configuration["Razorpay:KeyId"] ?? "rzp_test_SNRjwKdVarEWJH";
            var keySecret = _configuration["Razorpay:KeySecret"] ?? "7mymxetG5C7NHOKTqdBakkV7";
            return (keyId, keySecret);
        }

        public async Task<RazorpayOrderResult> CreateRazorpayOrderAsync(long customerId, long customerAddressId, string? couponCode, int useRewardCoins, string deliveryType = "standard")
        {
            var cartLines = await _cartRepository.GetCartAsync(customerId);
            if (cartLines.Count == 0)
            {
                return new RazorpayOrderResult { IsSuccess = false, Message = "Your cart is empty." };
            }

            var address = await _context.CustomerAddresses.FirstOrDefaultAsync(a =>
                a.Id == customerAddressId && a.CustomerId == customerId && !a.IsDeleted);
            if (address == null)
            {
                return new RazorpayOrderResult { IsSuccess = false, Message = "Selected delivery address was not found." };
            }

            var subtotal = cartLines.Sum(l => l.LineTotal);

            decimal discountAmount = 0;
            if (!string.IsNullOrWhiteSpace(couponCode))
            {
                var couponResult = await _couponService.ValidateAsync(couponCode, customerId, subtotal);
                if (couponResult.IsValid)
                {
                    discountAmount = couponResult.DiscountAmount;
                }
            }

            var shippingSetting = await _context.ShippingSettings.FirstOrDefaultAsync(s => s.IsActive);
            var freeShippingThreshold = shippingSetting?.FreeShippingThreshold ?? 500m;
            var standardShippingFee = shippingSetting?.StandardShippingPrice ?? 49m;
            var expressShippingFee = shippingSetting?.ExpressShippingPrice ?? 99m;
            var enableFreeShipping = shippingSetting?.EnableFreeShipping ?? true;
            var isExpress = string.Equals(deliveryType, "express", StringComparison.OrdinalIgnoreCase);
            // Express delivery is never free
            decimal deliveryFee;
            if (isExpress)
                deliveryFee = expressShippingFee;
            else
                deliveryFee = (subtotal >= freeShippingThreshold && enableFreeShipping) ? 0m : standardShippingFee;
            var amountAfterDiscount = subtotal - discountAmount + deliveryFee;

            decimal coinDiscount = 0;
            if (useRewardCoins > 0)
            {
                var coinResult = await _rewardService.ValidateCoinUsageAsync(customerId, useRewardCoins, amountAfterDiscount);
                if (coinResult.IsValid)
                {
                    coinDiscount = coinResult.CoinDiscountAmount;
                }
            }

            var totalAmount = amountAfterDiscount - coinDiscount;
            if (totalAmount < 0) totalAmount = 0;

            var amountInPaise = (long)Math.Round(totalAmount * 100m, MidpointRounding.AwayFromZero);
            if (amountInPaise <= 0)
            {
                return new RazorpayOrderResult { IsSuccess = false, Message = "Total order amount must be greater than zero." };
            }

            var (keyId, keySecret) = GetRazorpayCredentials();

            try
            {
                var receipt = "rcpt_" + DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");
                var payload = new
                {
                    amount = amountInPaise,
                    currency = "INR",
                    receipt = receipt,
                    payment_capture = 1
                };

                var authHeader = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{keyId}:{keySecret}"));
                var requestMessage = new HttpRequestMessage(HttpMethod.Post, "https://api.razorpay.com/v1/orders")
                {
                    Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
                };
                requestMessage.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authHeader);

                var response = await _httpClient.SendAsync(requestMessage);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return new RazorpayOrderResult
                    {
                        IsSuccess = false,
                        Message = $"Failed to create Razorpay order: {responseContent}"
                    };
                }

                using var doc = JsonDocument.Parse(responseContent);
                var root = doc.RootElement;
                var razorpayOrderId = root.GetProperty("id").GetString() ?? string.Empty;

                return new RazorpayOrderResult
                {
                    IsSuccess = true,
                    Message = "Razorpay order created successfully.",
                    RazorpayOrderId = razorpayOrderId,
                    KeyId = keyId,
                    Amount = totalAmount,
                    AmountInPaise = amountInPaise,
                    Currency = "INR"
                };
            }
            catch (Exception ex)
            {
                return new RazorpayOrderResult
                {
                    IsSuccess = false,
                    Message = $"Razorpay connection error: {ex.Message}"
                };
            }
        }

        public bool VerifyRazorpaySignature(string razorpayOrderId, string razorpayPaymentId, string razorpaySignature)
        {
            if (string.IsNullOrWhiteSpace(razorpayOrderId) ||
                string.IsNullOrWhiteSpace(razorpayPaymentId) ||
                string.IsNullOrWhiteSpace(razorpaySignature))
            {
                return false;
            }

            var (_, keySecret) = GetRazorpayCredentials();
            var payload = $"{razorpayOrderId}|{razorpayPaymentId}";

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(keySecret));
            var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
            var generatedSignature = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();

            return string.Equals(generatedSignature, razorpaySignature.Trim().ToLowerInvariant(), StringComparison.OrdinalIgnoreCase);
        }

        public async Task<OrderResult> ProcessSuccessfulOnlineOrderAsync(long customerId, RazorpayVerifyRequest request)
        {
            var isValidSignature = VerifyRazorpaySignature(request.RazorpayOrderId, request.RazorpayPaymentId, request.RazorpaySignature);
            if (!isValidSignature)
            {
                return new OrderResult
                {
                    IsSuccess = false,
                    Message = "Payment signature verification failed. Please contact support if your account was charged."
                };
            }

            // Create order with ONLINE mode and Paid status
            return await _orderService.CreateOrderFromCartAsync(
                customerId,
                request.CustomerAddressId,
                request.CouponCode,
                request.UseRewardCoins,
                paymentMode: "ONLINE",
                paymentStatus: OrderPaymentStatus.Paid,
                razorpayOrderId: request.RazorpayOrderId,
                razorpayPaymentId: request.RazorpayPaymentId,
                razorpaySignature: request.RazorpaySignature,
                deliveryType: request.DeliveryType
            );
        }
    }
}
