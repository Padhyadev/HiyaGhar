using Hiya2.Server.Repositories.Cart;

namespace Hiya2.Server.Services
{
    public class RazorpayOrderResult
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
        public string RazorpayOrderId { get; set; } = string.Empty;
        public string KeyId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public long AmountInPaise { get; set; }
        public string Currency { get; set; } = "INR";
    }

    public class RazorpayVerifyRequest
    {
        public string RazorpayOrderId { get; set; } = string.Empty;
        public string RazorpayPaymentId { get; set; } = string.Empty;
        public string RazorpaySignature { get; set; } = string.Empty;
        public long CustomerAddressId { get; set; }
        public string? CouponCode { get; set; }
        public int UseRewardCoins { get; set; } = 0;
        public string DeliveryType { get; set; } = "standard";
        public BuyNowItem? BuyNowItem { get; set; }
        /// <summary>Several items ordered without the cart (gift builder, "Gift only these items").</summary>
        public List<BuyNowItem>? BuyNowItems { get; set; }
        /// <summary>Same gift choice sent to create-order; the server prices it again.</summary>
        public Hiya2.Server.Services.Gifting.GiftRequest? Gift { get; set; }
    }

    public interface IPaymentService
    {
        Task<RazorpayOrderResult> CreateRazorpayOrderAsync(long customerId, long customerAddressId, string? couponCode, int useRewardCoins, string deliveryType = "standard", BuyNowItem? buyNowItem = null, Hiya2.Server.Services.Gifting.GiftRequest? gift = null, List<BuyNowItem>? buyNowItems = null);
        bool VerifyRazorpaySignature(string razorpayOrderId, string razorpayPaymentId, string razorpaySignature);
        Task<OrderResult> ProcessSuccessfulOnlineOrderAsync(long customerId, RazorpayVerifyRequest request);
    }
}
