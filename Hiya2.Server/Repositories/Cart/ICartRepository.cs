using Hiya2.Server.Models;

namespace Hiya2.Server.Repositories.Cart
{
    public class CartLine
    {
        public CartItem Item { get; set; } = null!;
        public Models.Product Product { get; set; } = null!;
        public ProductVariant? Variant { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineTotal { get; set; }
    }

    // "Buy Now" orders a single product directly - it is never added to the cart,
    // and the customer's cart is left untouched.
    public class BuyNowItem
    {
        public int ProductId { get; set; }
        public int? VariantId { get; set; }
        public string? PackingType { get; set; }
        public int Quantity { get; set; } = 1;
    }

    public class BuyNowLineResult
    {
        public CartLine? Line { get; set; }
        public string? Message { get; set; }
    }

    public class CartOperationResult
    {
        public bool IsSuccess { get; set; }
        public string? Message { get; set; }
        public CartItem? Item { get; set; }
    }

    public interface ICartRepository
    {
        Task<List<CartLine>> GetCartAsync(long customerId);
        Task<CartOperationResult> AddOrUpdateItemAsync(long customerId, int productId, int? variantId, string? packingType, int quantity);
        Task<bool> RemoveItemAsync(long customerId, long cartItemId);
        Task<int> MergeGuestCartAsync(long customerId, List<(int ProductId, int? VariantId, string? PackingType, int Quantity)> items);
        Task<decimal> GetSubtotalAsync(long customerId);
        Task ClearCartAsync(long customerId);
        Task<BuyNowLineResult> BuildBuyNowLineAsync(long customerId, BuyNowItem buyNowItem);
    }
}
