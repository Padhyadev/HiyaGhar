using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;
using Hiya2.Server.Services;

namespace Hiya2.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RewardController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IRewardService _rewardService;

        public RewardController(DataContext context, IRewardService rewardService)
        {
            _context = context;
            _rewardService = rewardService;
        }

        private long GetCurrentCustomerId()
        {
            var claimSub = User.FindFirstValue("CustomerId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            return long.TryParse(claimSub, out var id) ? id : 0;
        }

        private bool IsStaff() => User.FindFirstValue("token_type") == "staff";

        private long GetCurrentStaffId()
        {
            var claimSub = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return long.TryParse(claimSub, out var id) ? id : 0;
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _rewardService.GetSettingsAsync();
            return Ok(new
            {
                isSuccess = true,
                settings = new
                {
                    settings.SignupCoins,
                    settings.LoginCoins,
                    settings.ReferralCoins,
                    settings.ReferralJoinCoins,
                    settings.CoinToRupeeRate,
                    settings.MaxCoinUsagePercent
                }
            });
        }

        [Authorize]
        [HttpGet("my-ledger")]
        public async Task<IActionResult> GetMyLedger()
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0) return Unauthorized();

            var (balance, transactions) = await _rewardService.GetLedgerAsync(customerId);

            return Ok(new
            {
                isSuccess = true,
                balance,
                transactions = transactions.Select(t => new
                {
                    t.Id,
                    t.OrderId,
                    type = t.Type.ToString(),
                    t.Coins,
                    t.Source,
                    t.Remarks,
                    t.BalanceAfter,
                    t.CreatedDate
                })
            });
        }

        // --- Admin: RewardSetting CRUD ---

        [Authorize]
        [HttpPost("settings")]
        public async Task<IActionResult> SaveSettings([FromBody] RewardSetting dto)
        {
            if (!IsStaff()) return Forbid();

            var existing = await _context.RewardSettings.FirstOrDefaultAsync(s => s.IsActive);
            if (existing != null)
            {
                existing.SignupCoins = dto.SignupCoins;
                existing.LoginCoins = dto.LoginCoins;
                existing.ReferralCoins = dto.ReferralCoins;
                existing.ReferralJoinCoins = dto.ReferralJoinCoins;
                existing.CoinToRupeeRate = dto.CoinToRupeeRate;
                existing.MaxCoinUsagePercent = dto.MaxCoinUsagePercent;
                existing.LastModifiedDate = DateTime.Now;
                await _context.SaveChangesAsync();
                return Ok(new { isSuccess = true, message = "Reward settings updated.", settings = existing });
            }

            dto.IsActive = true;
            dto.CreatedDate = DateTime.Now;
            await _context.RewardSettings.AddAsync(dto);
            await _context.SaveChangesAsync();
            return Ok(new { isSuccess = true, message = "Reward settings saved.", settings = dto });
        }

        // --- Admin: OrderRewardSlab CRUD ---

        [Authorize]
        [HttpGet("slabs")]
        public async Task<IActionResult> GetSlabs()
        {
            if (!IsStaff()) return Forbid();

            var slabs = await _context.OrderRewardSlabs
                .AsNoTracking()
                .OrderBy(s => s.MinOrderAmount)
                .ToListAsync();
            return Ok(slabs);
        }

        [Authorize]
        [HttpPost("slabs")]
        public async Task<IActionResult> CreateSlab([FromBody] OrderRewardSlab slab)
        {
            if (!IsStaff()) return Forbid();

            slab.CreatedDate = DateTime.Now;
            await _context.OrderRewardSlabs.AddAsync(slab);
            await _context.SaveChangesAsync();
            return Ok(new { isSuccess = true, message = "Reward slab created.", slab });
        }

        [Authorize]
        [HttpPut("slabs/{id}")]
        public async Task<IActionResult> UpdateSlab(int id, [FromBody] OrderRewardSlab slab)
        {
            if (!IsStaff()) return Forbid();

            var existing = await _context.OrderRewardSlabs.FirstOrDefaultAsync(s => s.Id == id);
            if (existing == null)
            {
                return NotFound(new { isSuccess = false, message = "Reward slab not found." });
            }

            existing.MinOrderAmount = slab.MinOrderAmount;
            existing.MaxOrderAmount = slab.MaxOrderAmount;
            existing.RewardCoins = slab.RewardCoins;
            existing.IsActive = slab.IsActive;
            existing.LastModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(new { isSuccess = true, message = "Reward slab updated.", slab = existing });
        }

        [Authorize]
        [HttpDelete("slabs/{id}")]
        public async Task<IActionResult> DeleteSlab(int id)
        {
            if (!IsStaff()) return Forbid();

            var existing = await _context.OrderRewardSlabs.FirstOrDefaultAsync(s => s.Id == id);
            if (existing == null)
            {
                return NotFound(new { isSuccess = false, message = "Reward slab not found." });
            }

            existing.IsActive = false;
            existing.LastModifiedDate = DateTime.Now;
            await _context.SaveChangesAsync();
            return Ok(new { isSuccess = true, message = "Reward slab deleted." });
        }

        // --- Admin: manual coin grant + per-customer ledger lookup ---

        public class AdminCreditRequestDto
        {
            public long CustomerId { get; set; }
            public int Coins { get; set; }
            public string Remarks { get; set; } = string.Empty;
        }

        [Authorize]
        [HttpPost("admin-credit")]
        public async Task<IActionResult> AdminCredit([FromBody] AdminCreditRequestDto dto)
        {
            if (!IsStaff()) return Forbid();

            var result = await _rewardService.AdminCreditAsync(dto.CustomerId, dto.Coins, dto.Remarks, GetCurrentStaffId());
            if (!result.IsValid)
            {
                return BadRequest(new { isSuccess = false, message = result.Message });
            }
            return Ok(new { isSuccess = true, message = result.Message });
        }

        [Authorize]
        [HttpGet("ledger/{customerId}")]
        public async Task<IActionResult> GetLedgerForCustomer(long customerId)
        {
            if (!IsStaff()) return Forbid();

            var (balance, transactions) = await _rewardService.GetLedgerForAdminAsync(customerId);
            return Ok(new
            {
                isSuccess = true,
                balance,
                transactions = transactions.Select(t => new
                {
                    t.Id,
                    t.OrderId,
                    type = t.Type.ToString(),
                    t.Coins,
                    t.Source,
                    t.Remarks,
                    t.BalanceAfter,
                    t.CreatedDate
                })
            });
        }
    }
}
