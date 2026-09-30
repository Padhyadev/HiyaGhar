using Hiya2.Server.Models;

namespace Hiya2.Server.Repositories.Stock
{
    public class StockOperationResult
    {
        public bool IsSuccess { get; set; }
        public string? Message { get; set; }

        public static StockOperationResult Success(string? message = null) => new() { IsSuccess = true, Message = message };
        public static StockOperationResult Fail(string message) => new() { IsSuccess = false, Message = message };
    }

    public class StockOverviewLine
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int VariantId { get; set; }
        public string VariantName { get; set; } = string.Empty;
        public int AvailableStock { get; set; }
        public int ReservedStock { get; set; }
        public int SellableStock { get; set; }
        public bool IsInStock { get; set; }
        public string Status { get; set; } = string.Empty; // InStock | LowStock | OutOfStock
    }

    public interface IStockService
    {
        // Cart-driven flows. These do NOT open their own transaction - the caller
        // (CartRepository) wraps the reservation + cart-row write in one transaction.
        Task<StockOperationResult> ReserveAsync(long customerId, int productId, int variantId, long? cartItemId, int quantity, long? actorId = null);
        Task<StockOperationResult> ReleaseAsync(long customerId, int productId, int variantId, long? cartItemId, int quantity, long? actorId = null);

        // Order-driven flows. Called from WITHIN OrderService's existing transaction.
        Task<StockOperationResult> ConvertToSoldAsync(long customerId, int productId, int variantId, long? cartItemId, long orderId, int quantity, long? actorId = null);
        Task RestockForCancelOrReturnAsync(int productId, int variantId, int quantity, long orderId, bool isReturn, long? actorId = null);

        // Forward-looking hook for when online payment is added - no live caller today.
        Task ReleaseReservationForOrderAsync(long orderId, string reason, long? actorId = null);

        // Admin-driven. Opens and commits its own transaction.
        Task<StockOperationResult> AdjustStockAsync(int variantId, int quantityDelta, StockChangeType changeType, string remarks, long actorUserId);

        // Queries.
        Task<List<StockOverviewLine>> GetAllStockAsync();
        Task<List<ProductStockHistory>> GetHistoryAsync(int? productId, int? variantId);
        Task<List<StockReservation>> GetReservationsAsync(string? status);

        // Background sweep + lazy on-demand release for a single contended variant.
        Task<int> ReleaseExpiredReservationsAsync(int? variantId = null);
    }
}
