using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hiya2.Server.Repositories.Stock;

namespace Hiya2.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StockReservationController : ControllerBase
    {
        private readonly IStockService _stockService;

        public StockReservationController(IStockService stockService)
        {
            _stockService = stockService;
        }

        // Read-only by design - reservations are only ever mutated through
        // IStockService's atomic-update-plus-history path, never hand-edited here.
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? status)
        {
            var reservations = await _stockService.GetReservationsAsync(status);
            return Ok(new
            {
                isSuccess = true,
                items = reservations.Select(r => new
                {
                    id = r.Id,
                    customerId = r.CustomerId,
                    customerName = r.Customer != null ? $"{r.Customer.FirstName} {r.Customer.LastName}".Trim() : null,
                    productId = r.ProductId,
                    productName = r.Product?.ProductName,
                    variantId = r.VariantId,
                    variantName = r.Variant?.VariantName,
                    quantity = r.Quantity,
                    status = r.Status.ToString(),
                    reservedAt = r.ReservedAt,
                    expiresAt = r.ExpiresAt,
                    releasedAt = r.ReleasedAt,
                    orderId = r.OrderId
                })
            });
        }
    }
}
