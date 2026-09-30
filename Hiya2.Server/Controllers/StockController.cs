using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hiya2.Server.Models;
using Hiya2.Server.Repositories.Stock;

namespace Hiya2.Server.Controllers
{
    public class StockAdjustRequestDto
    {
        public int VariantId { get; set; }
        public int Quantity { get; set; }
        public string ChangeType { get; set; } = "StockIn"; // "StockIn" | "Adjustment"
        public string Remarks { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StockController : ControllerBase
    {
        private readonly IStockService _stockService;

        public StockController(IStockService stockService)
        {
            _stockService = stockService;
        }

        private long GetCurrentUserId()
        {
            var claimSub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return long.TryParse(claimSub, out var id) ? id : 0;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var lines = await _stockService.GetAllStockAsync();
            return Ok(new { isSuccess = true, items = lines });
        }

        [HttpGet("low-stock")]
        public async Task<IActionResult> GetLowStock()
        {
            var lines = await _stockService.GetAllStockAsync();
            return Ok(new { isSuccess = true, items = lines.Where(l => l.Status == "LowStock") });
        }

        [HttpGet("out-of-stock")]
        public async Task<IActionResult> GetOutOfStock()
        {
            var lines = await _stockService.GetAllStockAsync();
            return Ok(new { isSuccess = true, items = lines.Where(l => l.Status == "OutOfStock") });
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory([FromQuery] int? productId, [FromQuery] int? variantId)
        {
            var history = await _stockService.GetHistoryAsync(productId, variantId);
            return Ok(new
            {
                isSuccess = true,
                items = history.Select(h => new
                {
                    id = h.Id,
                    productId = h.ProductId,
                    productName = h.Product?.ProductName,
                    variantId = h.VariantId,
                    variantName = h.Variant?.VariantName,
                    changeType = h.ChangeType.ToString(),
                    quantityChanged = h.QuantityChanged,
                    previousStock = h.PreviousStock,
                    newStock = h.NewStock,
                    referenceId = h.ReferenceId,
                    referenceType = h.ReferenceType,
                    remarks = h.Remarks,
                    changedBy = h.ChangedBy,
                    changedDate = h.ChangedDate
                })
            });
        }

        [HttpPost("adjust")]
        public async Task<IActionResult> Adjust([FromBody] StockAdjustRequestDto dto)
        {
            if (dto.VariantId <= 0 || dto.Quantity == 0)
            {
                return BadRequest(new { isSuccess = false, message = "A valid variant and non-zero quantity are required." });
            }
            if (string.IsNullOrWhiteSpace(dto.Remarks))
            {
                return BadRequest(new { isSuccess = false, message = "A remark is required for every stock change." });
            }
            if (!Enum.TryParse<StockChangeType>(dto.ChangeType, true, out var changeType))
            {
                changeType = StockChangeType.Adjustment;
            }

            var actorId = GetCurrentUserId();
            var result = await _stockService.AdjustStockAsync(dto.VariantId, dto.Quantity, changeType, dto.Remarks, actorId);
            if (!result.IsSuccess)
            {
                return BadRequest(new { isSuccess = false, message = result.Message });
            }
            return Ok(new { isSuccess = true, message = result.Message });
        }
    }
}
