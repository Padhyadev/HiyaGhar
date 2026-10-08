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

            if (coupon.PerCustomerUsage.HasValue)
            {
                var customerUsage = await _context.CouponUsages.CountAsync(u => u.CouponId == coupon.Id && u.CustomerId == customerId);
                if (customerUsage >= coupon.PerCustomerUsage.Value)
                {
                    return new CouponValidationResult { IsValid = false, Message = "You have already used this coupon the maximum number of times." };
                }
            }

            if (coupon.IsFirstOrderOnly)
            {
                var hasPriorOrder = await _context.Orders.AnyAsync(o => o.CustomerId == customerId && !o.IsDeleted);
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
