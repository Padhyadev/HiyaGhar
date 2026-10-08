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
    }

    public interface IPaymentService
    {
        Task<RazorpayOrderResult> CreateRazorpayOrderAsync(long customerId, long customerAddressId, string? couponCode, int useRewardCoins, string deliveryType = "standard");
        bool VerifyRazorpaySignature(string razorpayOrderId, string razorpayPaymentId, string razorpaySignature);
        Task<OrderResult> ProcessSuccessfulOnlineOrderAsync(long customerId, RazorpayVerifyRequest request);
    }
}
