using Hiya2.Server.Models;

namespace Hiya2.Server.Services
{
    public class CouponValidationResult
    {
        public bool IsValid { get; set; }
        public string Message { get; set; } = string.Empty;
        public decimal DiscountAmount { get; set; }
        public Coupon? Coupon { get; set; }
    }

    public interface ICouponService
    {
        Task<CouponValidationResult> ValidateAsync(string code, long customerId, decimal cartSubtotal);
    }
}
