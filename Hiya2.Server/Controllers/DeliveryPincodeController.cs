using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;

namespace Hiya2.Server.Controllers
{
    public class UpdateDeliveryPincodeRequestDto
    {
        public bool IsAllowed { get; set; }
    }

    // The pincode list itself is fixed (seeded at startup); admins can only allow / not allow a
    // pincode, so there is deliberately no create, edit or delete endpoint.
    [ApiController]
    [Route("api/[controller]")]
    public class DeliveryPincodeController : ControllerBase
    {
        private readonly DataContext _context;

        public DeliveryPincodeController(DataContext context)
        {
            _context = context;
        }

        private bool IsStaff() => User.FindFirstValue("token_type") == "staff";

        // PUBLIC: pincodes the storefront may accept at checkout / address save.
        [HttpGet("allowed")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllowed()
        {
            var pincodes = await _context.DeliveryPincodes
                .AsNoTracking()
                .Where(p => p.IsAllowed)
                .OrderBy(p => p.Pincode)
                .Select(p => p.Pincode)
                .ToListAsync();
            return Ok(new { isSuccess = true, pincodes });
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll()
        {
            if (!IsStaff()) return Forbid();

            var pincodes = await _context.DeliveryPincodes
                .AsNoTracking()
                .OrderBy(p => p.Pincode)
                .Select(p => new { p.Id, p.Pincode, p.AreaName, p.IsAllowed, p.LastModifiedDate })
                .ToListAsync();
            return Ok(new { isSuccess = true, pincodes });
        }

        [HttpPut("{id}/allowed")]
        [Authorize]
        public async Task<IActionResult> SetAllowed(int id, [FromBody] UpdateDeliveryPincodeRequestDto dto)
        {
            if (!IsStaff()) return Forbid();

            var pincode = await _context.DeliveryPincodes.FirstOrDefaultAsync(p => p.Id == id);
            if (pincode == null)
                return NotFound(new { isSuccess = false, message = "Pincode not found." });

            pincode.IsAllowed = dto.IsAllowed;
            pincode.LastModifiedBy = long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ? userId : null;
            pincode.LastModifiedDate = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                isSuccess = true,
                message = dto.IsAllowed
                    ? $"Delivery allowed for {pincode.Pincode}."
                    : $"Delivery stopped for {pincode.Pincode}."
            });
        }
    }
}
