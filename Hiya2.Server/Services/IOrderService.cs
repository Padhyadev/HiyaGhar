using Hiya2.Server.Models;
using Hiya2.Server.Repositories.Cart;
using Hiya2.Server.Services.Gifting;

namespace Hiya2.Server.Services
{
    public class OrderResult
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public long OrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public decimal Subtotal { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal CoinDiscountAmount { get; set; }
        public decimal DeliveryFee { get; set; }
        public decimal GiftCharge { get; set; }
        public decimal TotalAmount { get; set; }
    }

    /// <summary>The lines a checkout is for: the Buy Now item, or the whole server cart.</summary>
    public class CheckoutLinesResult
    {
        public List<CartLine> Lines { get; set; } = new();
        public string? Error { get; set; }
    }

    /// <summary>
    /// Server-side price of an order. The ONE place totals are worked out - used both when
    /// creating the Razorpay order (the amount charged) and when saving the order.
    /// </summary>
    public class OrderPricing
    {
        public bool IsSuccess { get; set; }
        public string? Message { get; set; }
        public decimal Subtotal { get; set; }
        public decimal DiscountAmount { get; set; }
        public Coupon? AppliedCoupon { get; set; }
        public decimal DeliveryFee { get; set; }
        public int CoinsUsed { get; set; }
        public decimal CoinDiscountAmount { get; set; }
        public decimal GiftCharge { get; set; }
        public decimal TotalAmount { get; set; }
        public PreparedGift Gift { get; set; } = PreparedGift.None;
    }

    public interface IOrderService
    {
        Task<CheckoutLinesResult> LoadCheckoutLinesAsync(long customerId, BuyNowItem? buyNowItem, List<BuyNowItem>? buyNowItems = null);

        Task<OrderPricing> PriceOrderAsync(long customerId, List<CartLine> lines, string? couponCode, int useRewardCoins, string deliveryType, GiftRequest? gift);

        Task<OrderResult> CreateOrderFromCartAsync(
            long customerId,
            long customerAddressId,
            string? couponCode,
            int useRewardCoins,
            string paymentMode = "COD",
            OrderPaymentStatus paymentStatus = OrderPaymentStatus.Pending,
            string? razorpayOrderId = null,
            string? razorpayPaymentId = null,
            string? razorpaySignature = null,
            string deliveryType = "standard",
            BuyNowItem? buyNowItem = null,
            GiftRequest? gift = null,
            long? expectedTotalPaise = null,
            List<BuyNowItem>? buyNowItems = null);

        Task<List<Order>> GetOrdersByCustomerAsync(long customerId);
        Task<Order?> GetOrderByIdAsync(long orderId, long? customerId = null);
        Task<OrderResult> CancelOrderAsync(long orderId, long customerId, string reason);
        Task<List<Order>> GetAllOrdersAdminAsync(int page, int pageSize);
        Task<OrderResult> UpdateOrderStatusAsync(long orderId, OrderStatus newStatus, string? reason, long? changedBy, string? courierName = null, string? trackingNumber = null, string? trackingUrl = null);
        Task<OrderResult> UpdateOrderTrackingAsync(long orderId, string courierName, string trackingNumber, string? trackingUrl, long? changedBy);
        Task<OrderResult> UpdatePaymentStatusAsync(long orderId, OrderPaymentStatus newPaymentStatus, long? changedBy);
    }
}
