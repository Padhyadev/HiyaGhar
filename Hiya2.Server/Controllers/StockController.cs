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

    public class BulkStockItemDto
    {
        public int VariantId { get; set; }
        public int Quantity { get; set; }
        public string ChangeType { get; set; } = "Adjustment";
        public string Remarks { get; set; } = "Bulk stock update";
    }

    public class BulkStockAdjustRequestDto
    {
        public List<BulkStockItemDto> Items { get; set; } = new();
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

        [HttpPost("bulk-adjust")]
        public async Task<IActionResult> BulkAdjust([FromBody] BulkStockAdjustRequestDto dto)
        {
            if (dto.Items == null || dto.Items.Count == 0)
            {
                return BadRequest(new { isSuccess = false, message = "No stock items provided for adjustment." });
            }

            var actorId = GetCurrentUserId();
            int successCount = 0;
            var errors = new List<string>();

            foreach (var item in dto.Items)
            {
                if (item.VariantId <= 0 || item.Quantity == 0) continue;
                if (!Enum.TryParse<StockChangeType>(item.ChangeType, true, out var changeType))
                {
                    changeType = StockChangeType.Adjustment;
                }

                var remark = string.IsNullOrWhiteSpace(item.Remarks) ? "Bulk stock update" : item.Remarks.Trim();
                var result = await _stockService.AdjustStockAsync(item.VariantId, item.Quantity, changeType, remark, actorId);
                if (result.IsSuccess)
                {
                    successCount++;
                }
                else
                {
                    errors.Add($"Variant #{item.VariantId}: {result.Message}");
                }
            }

            return Ok(new
            {
                isSuccess = true,
                message = $"Successfully updated {successCount} stock items." + (errors.Count > 0 ? $" ({errors.Count} failed)" : ""),
                updatedCount = successCount,
                errors
            });
        }
    }
}
