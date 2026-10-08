using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;

namespace Hiya2.Server.Controllers
{
    public class StockSettingRequestDto
    {
        public int DefaultLowStockThreshold { get; set; }
        public int ReservationExpiryMinutes { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StockSettingController : ControllerBase
    {
        private readonly DataContext _context;

        public StockSettingController(DataContext context)
        {
            _context = context;
        }

        private long GetCurrentUserId()
        {
            var claimSub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return long.TryParse(claimSub, out var id) ? id : 0;
        }

        private async Task<StockSetting> GetOrCreateAsync()
        {
            var setting = await _context.StockSettings.FirstOrDefaultAsync(s => s.IsActive);
            if (setting == null)
            {
                setting = new StockSetting();
                await _context.StockSettings.AddAsync(setting);
                await _context.SaveChangesAsync();
            }
            return setting;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var setting = await GetOrCreateAsync();
            return Ok(new
            {
                isSuccess = true,
                defaultLowStockThreshold = setting.DefaultLowStockThreshold,
                reservationExpiryMinutes = setting.ReservationExpiryMinutes
            });
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] StockSettingRequestDto dto)
        {
            if (dto.DefaultLowStockThreshold < 0 || dto.ReservationExpiryMinutes <= 0)
            {
                return BadRequest(new { isSuccess = false, message = "Please provide valid, positive values." });
            }

            var setting = await GetOrCreateAsync();
            setting.DefaultLowStockThreshold = dto.DefaultLowStockThreshold;
            setting.ReservationExpiryMinutes = dto.ReservationExpiryMinutes;
            setting.LastModifiedBy = GetCurrentUserId();
            setting.LastModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(new { isSuccess = true, message = "Stock settings updated." });
        }
    }
}
