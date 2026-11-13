using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using HIyaghar.Infra;
using Hiya2.Server.Models;
using Hiya2.Server.Repositories.Cart;
using Hiya2.Server.Services.Gifting;
using Microsoft.EntityFrameworkCore;

namespace Hiya2.Server.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IConfiguration _configuration;
        private readonly IOrderService _orderService;
        private readonly DataContext _context;
        private readonly HttpClient _httpClient;

        public PaymentService(
            IConfiguration configuration,
            IOrderService orderService,
            DataContext context)
        {
            _configuration = configuration;
            _orderService = orderService;
            _context = context;
            _httpClient = new HttpClient();
        }

        private (string KeyId, string KeySecret) GetRazorpayCredentials()
        {
            var keyId = _configuration["Razorpay:KeyId"] ?? "rzp_test_SNRjwKdVarEWJH";
            var keySecret = _configuration["Razorpay:KeySecret"] ?? "7mymxetG5C7NHOKTqdBakkV7";
            return (keyId, keySecret);
        }

        public async Task<RazorpayOrderResult> CreateRazorpayOrderAsync(long customerId, long customerAddressId, string? couponCode, int useRewardCoins, string deliveryType = "standard", BuyNowItem? buyNowItem = null, GiftRequest? gift = null, List<BuyNowItem>? buyNowItems = null)
        {
            var linesResult = await _orderService.LoadCheckoutLinesAsync(customerId, buyNowItem, buyNowItems);
            if (linesResult.Error != null)
            {
                return new RazorpayOrderResult { IsSuccess = false, Message = linesResult.Error };
            }

            var address = await _context.CustomerAddresses.FirstOrDefaultAsync(a =>
                a.Id == customerAddressId && a.CustomerId == customerId && !a.IsDeleted);
            if (address == null)
            {
                return new RazorpayOrderResult { IsSuccess = false, Message = "Selected delivery address was not found." };
            }

            // Same pricing as OrderService.CreateOrderFromCartAsync (one shared method), so the
            // amount charged matches the order total - including any gift packing charge.
            var pricing = await _orderService.PriceOrderAsync(customerId, linesResult.Lines, couponCode, useRewardCoins, deliveryType, gift);
            if (!pricing.IsSuccess)
            {
                return new RazorpayOrderResult { IsSuccess = false, Message = pricing.Message ?? "Could not price this order." };
            }

            var totalAmount = pricing.TotalAmount;
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

                var requestMessage = new HttpRequestMessage(HttpMethod.Post, "https://api.razorpay.com/v1/orders")
                {
                    Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
                };
                requestMessage.Headers.Authorization = BasicAuth(keyId, keySecret);

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

            // One Razorpay payment = one order. A repeated verify (double click, retry) returns the
            // order already placed for it instead of creating another one.
            var existing = await _context.Orders.FirstOrDefaultAsync(o => o.RazorpayOrderId == request.RazorpayOrderId && !o.IsDeleted);
            if (existing != null)
            {
                if (existing.CustomerId != customerId)
                {
                    return new OrderResult { IsSuccess = false, Message = "This payment has already been used for another order." };
                }
                return new OrderResult
                {
                    IsSuccess = true,
                    Message = "Order already placed for this payment.",
                    OrderId = existing.Id,
                    OrderNumber = existing.OrderNumber,
                    Subtotal = existing.Subtotal,
                    DiscountAmount = existing.DiscountAmount,
                    CoinDiscountAmount = existing.CoinDiscountAmount,
                    DeliveryFee = existing.DeliveryFee,
                    GiftCharge = existing.GiftCharge,
                    TotalAmount = existing.TotalAmount
                };
            }

            // The order total must equal what Razorpay actually charged, so a changed cart or
            // gift option between payment and verify can't produce a mismatched order.
            var paidPaise = await GetRazorpayOrderAmountPaiseAsync(request.RazorpayOrderId);

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
                deliveryType: request.DeliveryType,
                buyNowItem: request.BuyNowItem,
                gift: request.Gift,
                expectedTotalPaise: paidPaise,
                buyNowItems: request.BuyNowItems
            );
        }

        // Amount (in paise) of the Razorpay order; null if Razorpay can't be reached, in which
        // case the order is still placed (the signature already proves the payment is genuine).
        private async Task<long?> GetRazorpayOrderAmountPaiseAsync(string razorpayOrderId)
        {
            try
            {
                var (keyId, keySecret) = GetRazorpayCredentials();
                var request = new HttpRequestMessage(HttpMethod.Get, $"https://api.razorpay.com/v1/orders/{Uri.EscapeDataString(razorpayOrderId)}");
                request.Headers.Authorization = BasicAuth(keyId, keySecret);
                using var response = await _httpClient.SendAsync(request);
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"[PAYMENT] Could not read Razorpay order {razorpayOrderId}: HTTP {(int)response.StatusCode}");
                    return null;
                }
                using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
                return doc.RootElement.TryGetProperty("amount", out var amount) && amount.TryGetInt64(out var paise) ? paise : null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PAYMENT] Could not read Razorpay order {razorpayOrderId}: {ex.Message}");
                return null;
            }
        }

        private static System.Net.Http.Headers.AuthenticationHeaderValue BasicAuth(string keyId, string keySecret) =>
            new("Basic", Convert.ToBase64String(Encoding.UTF8.GetBytes($"{keyId}:{keySecret}")));
    }
}
