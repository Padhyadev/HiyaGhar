using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;

namespace Hiya2.Server.Services
{
    public class CouponService : ICouponService
    {
        private readonly DataContext _context;

        public CouponService(DataContext context)
        {
            _context = context;
        }

        private async Task<List<long>> GetSamePersonCustomerIdsAsync(long customerId)
        {
            var customer = await _context.Customers.AsNoTracking()
                .Where(c => c.CustomerId == customerId)
                .Select(c => new { c.Email, c.MobileNo })
                .FirstOrDefaultAsync();
            if (customer == null)
            {
                return new List<long> { customerId };
            }

            var email = (customer.Email ?? string.Empty).ToLower();
            var mobile = customer.MobileNo ?? string.Empty;
            var ids = await _context.Customers.AsNoTracking()
                .Where(c => c.CustomerId == customerId
                    || (email != "" && c.Email.ToLower() == email)
                    || (mobile != "" && c.MobileNo == mobile))
                .Select(c => c.CustomerId)
                .ToListAsync();
            return ids;
        }

        public async Task<CouponValidationResult> ValidateAsync(string code, long customerId, decimal cartSubtotal)
        {
            var normalizedCode = (code ?? string.Empty).Trim().ToUpper();

            var coupon = await _context.Coupons.FirstOrDefaultAsync(c =>
                c.Code.ToUpper() == normalizedCode && c.IsActive && !c.IsDeleted);

            if (coupon == null)
            {
                return new CouponValidationResult { IsValid = false, Message = "Invalid coupon code." };
            }

            // Guest checkout makes a new CustomerId each time, so per-customer limits
            // count every customer row sharing this shopper's email or mobile.
            var samePersonIds = await GetSamePersonCustomerIdsAsync(customerId);
            return await CheckEligibilityAsync(coupon, samePersonIds, cartSubtotal);
        }

        public async Task<AutoOfferResult> GetAutoOfferAsync(long customerId, decimal cartSubtotal)
        {
            var result = new AutoOfferResult();
            if (cartSubtotal <= 0)
            {
                return result;
            }

            var now = DateTime.Now;
            var offers = await _context.Coupons
                .Where(c => c.IsActive && !c.IsDeleted && now >= c.StartDate && now <= c.EndDate)
                .OrderBy(c => c.MinOrderAmount)
                .ToListAsync();
            if (offers.Count == 0)
            {
                return result;
            }

            var samePersonIds = await GetSamePersonCustomerIdsAsync(customerId);

            var eligibleNow = new List<Coupon>();
            foreach (var offer in offers.Where(o => o.MinOrderAmount <= cartSubtotal))
            {
                var check = await CheckEligibilityAsync(offer, samePersonIds, cartSubtotal);
                if (!check.IsValid)
                {
                    continue;
                }
                eligibleNow.Add(offer);
                if (check.DiscountAmount > (result.Applied?.DiscountAmount ?? 0))
                {
                    result.Applied = check;
                }
            }

            // Offers are sorted by minimum amount, so the first one that would save more is the
            // closest step up. "More" is judged at that offer's minimum: a 10%-above-₹300 offer
            // is no step up from a 10% offer the cart already has.
            foreach (var offer in offers.Where(o => o.MinOrderAmount > cartSubtotal))
            {
                var check = await CheckEligibilityAsync(offer, samePersonIds, offer.MinOrderAmount);
                var alreadyAtThatAmount = eligibleNow.Count == 0 ? 0 : eligibleNow.Max(o => CalculateDiscount(o, offer.MinOrderAmount));
                if (check.IsValid && check.DiscountAmount > alreadyAtThatAmount)
                {
                    result.Next = new NextOfferInfo
                    {
                        Coupon = offer,
                        AmountNeeded = offer.MinOrderAmount - cartSubtotal,
                        DiscountAmount = check.DiscountAmount
                    };
                    break;
                }
            }

            if (result.Applied != null)
            {
                result.Applied.Message = $"{GetOfferLabel(result.Applied.Coupon!)} applied automatically.";
            }

            return result;
        }

        public async Task<CouponValidationResult> ResolveDiscountAsync(string? code, long customerId, decimal cartSubtotal)
        {
            var auto = (await GetAutoOfferAsync(customerId, cartSubtotal)).Applied;

            if (!string.IsNullOrWhiteSpace(code))
            {
                var manual = await ValidateAsync(code, customerId, cartSubtotal);
                if (!manual.IsValid)
                {
                    return manual;
                }
                if (auto == null || manual.DiscountAmount >= auto.DiscountAmount)
                {
                    return manual;
                }
            }

            return auto ?? new CouponValidationResult { IsValid = true, Message = "No offer applies to this cart." };
        }

        public string GetOfferLabel(Coupon coupon)
        {
            var benefit = coupon.DiscountType == CouponDiscountType.Percent
                ? $"{coupon.DiscountValue:0.##}% OFF"
                : $"₹{coupon.DiscountValue:0.##} OFF";
            return coupon.MinOrderAmount > 0 ? $"{benefit} on orders above ₹{coupon.MinOrderAmount:0.##}" : benefit;
        }

        private async Task<CouponValidationResult> CheckEligibilityAsync(Coupon coupon, List<long> samePersonIds, decimal cartSubtotal)
        {
            var now = DateTime.Now;
            if (now < coupon.StartDate || now > coupon.EndDate)
            {
                return new CouponValidationResult { IsValid = false, Message = "This coupon is not currently active." };
            }

            if (cartSubtotal < coupon.MinOrderAmount)
            {
                return new CouponValidationResult
                {
                    IsValid = false,
                    Message = $"Minimum order amount for this coupon is ₹{coupon.MinOrderAmount:0.##}."
                };
            }

            if (coupon.MaxUsage.HasValue)
            {
                var totalUsage = await _context.CouponUsages.CountAsync(u => u.CouponId == coupon.Id);
                if (totalUsage >= coupon.MaxUsage.Value)
                {
                    return new CouponValidationResult { IsValid = false, Message = "This coupon has reached its usage limit." };
                }
            }

            if (coupon.PerCustomerUsage.HasValue)
            {
                var customerUsage = await _context.CouponUsages.CountAsync(u => u.CouponId == coupon.Id && samePersonIds.Contains(u.CustomerId));
                if (customerUsage >= coupon.PerCustomerUsage.Value)
                {
                    return new CouponValidationResult { IsValid = false, Message = "You have already used this coupon the maximum number of times." };
                }
            }

            if (coupon.IsFirstOrderOnly)
            {
                var hasPriorOrder = await _context.Orders.AnyAsync(o => samePersonIds.Contains(o.CustomerId) && !o.IsDeleted);
                if (hasPriorOrder)
                {
                    return new CouponValidationResult { IsValid = false, Message = "This coupon is valid for first-time orders only." };
                }
            }

            return new CouponValidationResult
            {
                IsValid = true,
                Message = "Coupon applied successfully.",
                DiscountAmount = CalculateDiscount(coupon, cartSubtotal),
                Coupon = coupon
            };
        }

        private static decimal CalculateDiscount(Coupon coupon, decimal cartSubtotal)
        {
            decimal discount = coupon.DiscountType == CouponDiscountType.Percent
                ? Math.Round(cartSubtotal * (coupon.DiscountValue / 100m), 2)
                : coupon.DiscountValue;

            if (coupon.MaxDiscountAmount.HasValue && discount > coupon.MaxDiscountAmount.Value)
            {
                discount = coupon.MaxDiscountAmount.Value;
            }

            return Math.Min(discount, cartSubtotal);
        }
    }
}
