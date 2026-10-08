using Hiya2.Server.Models;

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
        public decimal TotalAmount { get; set; }
    }

    public interface IOrderService
    {
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
            string deliveryType = "standard");
        Task<List<Order>> GetOrdersByCustomerAsync(long customerId);
        Task<Order?> GetOrderByIdAsync(long orderId, long? customerId = null);
        Task<OrderResult> CancelOrderAsync(long orderId, long customerId, string reason);

        Task<List<Order>> GetAllOrdersAdminAsync(int page, int pageSize);
        Task<OrderResult> UpdateOrderStatusAsync(long orderId, OrderStatus newStatus, string? reason, long? changedBy, string? courierName = null, string? trackingNumber = null, string? trackingUrl = null);
        Task<OrderResult> UpdateOrderTrackingAsync(long orderId, string courierName, string trackingNumber, string? trackingUrl, long? changedBy);
        Task<OrderResult> UpdatePaymentStatusAsync(long orderId, OrderPaymentStatus newPaymentStatus, long? changedBy);
    }
}
