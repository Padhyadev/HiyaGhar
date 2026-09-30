using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;

namespace Hiya2.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CouponController : ControllerBase
    {
        private readonly DataContext _context;

        public CouponController(DataContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var coupons = await _context.Coupons
                .AsNoTracking()
                .Where(c => !c.IsDeleted)
                .OrderByDescending(c => c.Id)
                .ToListAsync();

            return Ok(coupons);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
            if (coupon == null)
            {
                return NotFound(new { isSuccess = false, message = "Coupon not found." });
            }
            return Ok(coupon);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Coupon coupon)
        {
            if (string.IsNullOrWhiteSpace(coupon.Code))
            {
                return BadRequest(new { isSuccess = false, message = "Coupon code is required." });
            }

            var codeExists = await _context.Coupons.AnyAsync(c => c.Code.ToUpper() == coupon.Code.Trim().ToUpper() && !c.IsDeleted);
            if (codeExists)
            {
                return BadRequest(new { isSuccess = false, message = "A coupon with this code already exists." });
            }

            coupon.Code = coupon.Code.Trim().ToUpper();
            coupon.IsDeleted = false;
            coupon.CreatedDate = DateTime.Now;

            await _context.Coupons.AddAsync(coupon);
            await _context.SaveChangesAsync();

            return Ok(new { isSuccess = true, message = "Coupon created successfully.", coupon });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Coupon coupon)
        {
            var existing = await _context.Coupons.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
            if (existing == null)
            {
                return NotFound(new { isSuccess = false, message = "Coupon not found." });
            }

            existing.Description = coupon.Description;
            existing.DiscountType = coupon.DiscountType;
            existing.DiscountValue = coupon.DiscountValue;
            existing.MaxDiscountAmount = coupon.MaxDiscountAmount;
            existing.MinOrderAmount = coupon.MinOrderAmount;
            existing.StartDate = coupon.StartDate;
            existing.EndDate = coupon.EndDate;
            existing.MaxUsage = coupon.MaxUsage;
            existing.PerCustomerUsage = coupon.PerCustomerUsage;
            existing.IsFirstOrderOnly = coupon.IsFirstOrderOnly;
            existing.IsActive = coupon.IsActive;
            existing.LastModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new { isSuccess = true, message = "Coupon updated successfully.", coupon = existing });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
            if (coupon == null)
            {
                return NotFound(new { isSuccess = false, message = "Coupon not found." });
            }

            coupon.IsActive = false;
            coupon.IsDeleted = true;
            coupon.LastModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new { isSuccess = true, message = "Coupon deleted successfully." });
        }
    }
}
