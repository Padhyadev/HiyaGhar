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

            // Guest checkout makes a new CustomerId each time, so per-customer limits
            // count every customer row sharing this shopper's email or mobile.
            var samePersonIds = await GetSamePersonCustomerIdsAsync(customerId);

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

            decimal discount = coupon.DiscountType == CouponDiscountType.Percent
                ? Math.Round(cartSubtotal * (coupon.DiscountValue / 100m), 2)
                : coupon.DiscountValue;

            if (coupon.MaxDiscountAmount.HasValue && discount > coupon.MaxDiscountAmount.Value)
            {
                discount = coupon.MaxDiscountAmount.Value;
            }

            if (discount > cartSubtotal)
            {
                discount = cartSubtotal;
            }

            return new CouponValidationResult
            {
                IsValid = true,
                Message = "Coupon applied successfully.",
                DiscountAmount = discount,
                Coupon = coupon
            };
        }
    }
}
