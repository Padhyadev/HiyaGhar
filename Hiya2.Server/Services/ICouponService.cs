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

    /// <summary>The next offer the shopper can unlock by adding more to the cart.</summary>
    public class NextOfferInfo
    {
        public Coupon Coupon { get; set; } = null!;
        public decimal AmountNeeded { get; set; }
        public decimal DiscountAmount { get; set; }
    }

    public class AutoOfferResult
    {
        /// <summary>Best offer the cart qualifies for now; null when none applies.</summary>
        public CouponValidationResult? Applied { get; set; }
        public NextOfferInfo? Next { get; set; }
    }

    public interface ICouponService
    {
        Task<CouponValidationResult> ValidateAsync(string code, long customerId, decimal cartSubtotal);

        /// <summary>
        /// Offers apply automatically, no code needed: picks the active offer with the biggest
        /// discount for this cart, and the cheapest bigger offer still to unlock.
        /// </summary>
        Task<AutoOfferResult> GetAutoOfferAsync(long customerId, decimal cartSubtotal);

        /// <summary>
        /// The discount checkout charges: the best automatic offer, or the given code if that
        /// saves more. An invalid code fails, as before.
        /// </summary>
        Task<CouponValidationResult> ResolveDiscountAsync(string? code, long customerId, decimal cartSubtotal);

        string GetOfferLabel(Coupon coupon);
    }
}
