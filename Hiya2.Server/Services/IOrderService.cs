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
        Task<OrderResult> CreateOrderFromCartAsync(long customerId, long customerAddressId, string? couponCode, int useRewardCoins);
        Task<List<Order>> GetOrdersByCustomerAsync(long customerId);
        Task<Order?> GetOrderByIdAsync(long orderId, long? customerId = null);
        Task<OrderResult> CancelOrderAsync(long orderId, long customerId, string reason);

        Task<List<Order>> GetAllOrdersAdminAsync(int page, int pageSize);
        Task<OrderResult> UpdateOrderStatusAsync(long orderId, OrderStatus newStatus, string? reason, long? changedBy);
    }
}
