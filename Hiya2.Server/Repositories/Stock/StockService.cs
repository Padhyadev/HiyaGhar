using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;

namespace Hiya2.Server.Repositories.Stock
{
    public class StockService : IStockService
    {
        private readonly DataContext _context;

        public StockService(DataContext context)
        {
            _context = context;
        }

        /// <summary>
        /// The single, atomic stock mutation used by every code path (reserve, release,
        /// convert-to-sold, restock, admin adjust). SQL Server evaluates one UPDATE ... WHERE
        /// statement as a single unit against the true committed row and holds the row lock
        /// for its duration, so two concurrent callers for the same variant serialize
        /// automatically - only one can see a guard clause succeed. This is what prevents
        /// overselling/double-reservation without needing explicit UPDLOCK/HOLDLOCK hints.
        /// Both Available and Reserved are floor-clamped at 0 so no path can drive them negative.
        /// Returns the number of rows affected: 1 = succeeded, 0 = guard failed (insufficient stock).
        /// </summary>
        private async Task<int> ApplyStockDeltaAsync(int variantId, int availableDelta, int reservedDelta, bool requireSellable, bool requireReserved, int guardQuantity)
        {
            var sql = @"
UPDATE ProductVariant
SET AvailableStock = CASE WHEN AvailableStock + @availableDelta < 0 THEN 0 ELSE AvailableStock + @availableDelta END,
    ReservedStock  = CASE WHEN ReservedStock + @reservedDelta < 0 THEN 0 ELSE ReservedStock + @reservedDelta END,
    IsInStock = CASE WHEN
        (CASE WHEN AvailableStock + @availableDelta < 0 THEN 0 ELSE AvailableStock + @availableDelta END)
      - (CASE WHEN ReservedStock + @reservedDelta < 0 THEN 0 ELSE ReservedStock + @reservedDelta END) > 0
        THEN 1 ELSE 0 END
WHERE Id = @variantId";

            if (requireSellable)
            {
                sql += " AND (AvailableStock - ReservedStock) >= @guardQuantity";
            }
            if (requireReserved)
            {
                sql += " AND ReservedStock >= @guardQuantity";
            }

            return await _context.Database.ExecuteSqlRawAsync(sql,
                new SqlParameter("@availableDelta", availableDelta),
                new SqlParameter("@reservedDelta", reservedDelta),
                new SqlParameter("@variantId", variantId),
                new SqlParameter("@guardQuantity", guardQuantity));
        }

        private async Task<ProductVariant?> ReadVariantAsync(int variantId)
        {
            return await _context.ProductVariants.AsNoTracking().FirstOrDefaultAsync(v => v.Id == variantId);
        }

        private async Task<int> GetReservationExpiryMinutesAsync()
        {
            var setting = await _context.StockSettings.AsNoTracking().FirstOrDefaultAsync(s => s.IsActive);
            return setting?.ReservationExpiryMinutes ?? 20;
        }

        public async Task<StockOperationResult> ReserveAsync(long customerId, int productId, int variantId, long? cartItemId, int quantity, long? actorId = null)
        {
            if (quantity <= 0) return StockOperationResult.Success();

            var before = await ReadVariantAsync(variantId);
            if (before == null) return StockOperationResult.Fail("Product variant not found.");

            var affected = await ApplyStockDeltaAsync(variantId, 0, quantity, true, false, quantity);
            if (affected == 0)
            {
                // Belt-and-suspenders: release anything past its expiry for this exact
                // variant in case the background sweep hasn't reached it yet, then retry once.
                if (await ReleaseExpiredReservationsAsync(variantId) > 0)
                {
                    affected = await ApplyStockDeltaAsync(variantId, 0, quantity, true, false, quantity);
                }
            }
            if (affected == 0)
            {
                return StockOperationResult.Fail("Not enough stock available.");
            }

            var after = await ReadVariantAsync(variantId);

            var existingReservation = await _context.StockReservations.FirstOrDefaultAsync(r =>
                r.CustomerId == customerId && r.ProductId == productId && r.VariantId == variantId && r.Status == StockReservationStatus.Reserved);

            var expiresAt = DateTime.Now.AddMinutes(await GetReservationExpiryMinutesAsync());
            if (existingReservation != null)
            {
                existingReservation.Quantity += quantity;
                existingReservation.ExpiresAt = expiresAt;
                existingReservation.LastModifiedDate = DateTime.Now;
            }
            else
            {
                await _context.StockReservations.AddAsync(new StockReservation
                {
                    CustomerId = customerId,
                    CartItemId = cartItemId,
                    ProductId = productId,
                    VariantId = variantId,
                    Quantity = quantity,
                    Status = StockReservationStatus.Reserved,
                    ReservedAt = DateTime.Now,
                    ExpiresAt = expiresAt,
                    CreatedDate = DateTime.Now
                });
            }

            await _context.ProductStockHistories.AddAsync(new ProductStockHistory
            {
                ProductId = productId,
                VariantId = variantId,
                ChangeType = StockChangeType.Reserved,
                QuantityChanged = quantity,
                PreviousStock = before.ReservedStock,
                NewStock = after?.ReservedStock ?? before.ReservedStock + quantity,
                ReferenceId = cartItemId,
                ReferenceType = "CartItem",
                ChangedBy = actorId ?? customerId,
                ChangedDate = DateTime.Now
            });

            return StockOperationResult.Success();
        }

        public async Task<StockOperationResult> ReleaseAsync(long customerId, int productId, int variantId, long? cartItemId, int quantity, long? actorId = null)
        {
            if (quantity <= 0) return StockOperationResult.Success();

            var before = await ReadVariantAsync(variantId);
            if (before == null) return StockOperationResult.Fail("Product variant not found.");

            await ApplyStockDeltaAsync(variantId, 0, -quantity, false, false, 0);
            var after = await ReadVariantAsync(variantId);

            var reservation = await _context.StockReservations.FirstOrDefaultAsync(r =>
                r.CustomerId == customerId && r.ProductId == productId && r.VariantId == variantId && r.Status == StockReservationStatus.Reserved);
            if (reservation != null)
            {
                reservation.Quantity -= quantity;
                reservation.LastModifiedDate = DateTime.Now;
                if (reservation.Quantity <= 0)
                {
                    reservation.Quantity = 0;
                    reservation.Status = StockReservationStatus.Released;
                    reservation.ReleasedAt = DateTime.Now;
                }
            }

            await _context.ProductStockHistories.AddAsync(new ProductStockHistory
            {
                ProductId = productId,
                VariantId = variantId,
                ChangeType = StockChangeType.Released,
                QuantityChanged = -quantity,
                PreviousStock = before.ReservedStock,
                NewStock = after?.ReservedStock ?? Math.Max(0, before.ReservedStock - quantity),
                ReferenceId = cartItemId,
                ReferenceType = "CartItem",
                ChangedBy = actorId ?? customerId,
                ChangedDate = DateTime.Now
            });

            return StockOperationResult.Success();
        }

        public async Task<StockOperationResult> ConvertToSoldAsync(long customerId, int productId, int variantId, long? cartItemId, long orderId, int quantity, long? actorId = null)
        {
            if (quantity <= 0) return StockOperationResult.Success();

            var before = await ReadVariantAsync(variantId);
            if (before == null) return StockOperationResult.Fail("Product variant not found.");

            var affected = await ApplyStockDeltaAsync(variantId, -quantity, -quantity, false, true, quantity);
            if (affected == 0)
            {
                return StockOperationResult.Fail("Reserved stock did not match at checkout.");
            }

            var after = await ReadVariantAsync(variantId);

            var reservation = await _context.StockReservations.FirstOrDefaultAsync(r =>
                r.CustomerId == customerId && r.ProductId == productId && r.VariantId == variantId && r.Status == StockReservationStatus.Reserved);
            if (reservation != null)
            {
                reservation.Status = StockReservationStatus.Converted;
                reservation.OrderId = orderId;
                reservation.LastModifiedDate = DateTime.Now;
            }

            await _context.ProductStockHistories.AddAsync(new ProductStockHistory
            {
                ProductId = productId,
                VariantId = variantId,
                ChangeType = StockChangeType.Sold,
                QuantityChanged = -quantity,
                PreviousStock = before.AvailableStock,
                NewStock = after?.AvailableStock ?? before.AvailableStock - quantity,
                ReferenceId = orderId,
                ReferenceType = "Order",
                ChangedBy = actorId ?? customerId,
                ChangedDate = DateTime.Now
            });

            return StockOperationResult.Success();
        }

        public async Task RestockForCancelOrReturnAsync(int productId, int variantId, int quantity, long orderId, bool isReturn, long? actorId = null)
        {
            if (quantity <= 0) return;

            var before = await ReadVariantAsync(variantId);
            if (before == null) return;

            await ApplyStockDeltaAsync(variantId, quantity, 0, false, false, 0);
            var after = await ReadVariantAsync(variantId);

            await _context.ProductStockHistories.AddAsync(new ProductStockHistory
            {
                ProductId = productId,
                VariantId = variantId,
                ChangeType = isReturn ? StockChangeType.Returned : StockChangeType.StockIn,
                QuantityChanged = quantity,
                PreviousStock = before.AvailableStock,
                NewStock = after?.AvailableStock ?? before.AvailableStock + quantity,
                ReferenceId = orderId,
                ReferenceType = "Order",
                Remarks = isReturn ? "Order returned - stock restored." : "Order cancelled - stock restored.",
                ChangedBy = actorId,
                ChangedDate = DateTime.Now
            });
        }

        public async Task ReleaseReservationForOrderAsync(long orderId, string reason, long? actorId = null)
        {
            // Forward-looking hook for when online payment (and a real "payment failed"
            // callback) is added - no live caller today; see plan §6.5.
            var reservations = await _context.StockReservations
                .Where(r => r.OrderId == orderId && r.Status == StockReservationStatus.Reserved)
                .ToListAsync();

            foreach (var reservation in reservations)
            {
                await ReleaseAsync(reservation.CustomerId, reservation.ProductId, reservation.VariantId, reservation.CartItemId, reservation.Quantity, actorId);
            }
            await _context.SaveChangesAsync();
        }

        public async Task<StockOperationResult> AdjustStockAsync(int variantId, int quantityDelta, StockChangeType changeType, string remarks, long actorUserId)
        {
            if (quantityDelta == 0) return StockOperationResult.Fail("Quantity must be non-zero.");
            if (string.IsNullOrWhiteSpace(remarks)) return StockOperationResult.Fail("A remark is required for every stock change.");

            var before = await ReadVariantAsync(variantId);
            if (before == null) return StockOperationResult.Fail("Product variant not found.");

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await ApplyStockDeltaAsync(variantId, quantityDelta, 0, false, false, 0);
                var after = await ReadVariantAsync(variantId);

                await _context.ProductStockHistories.AddAsync(new ProductStockHistory
                {
                    ProductId = before.ProductId,
                    VariantId = variantId,
                    ChangeType = changeType,
                    QuantityChanged = quantityDelta,
                    PreviousStock = before.AvailableStock,
                    NewStock = after?.AvailableStock ?? before.AvailableStock,
                    ReferenceType = "AdminAdjustment",
                    Remarks = remarks,
                    ChangedBy = actorUserId,
                    ChangedDate = DateTime.Now
                });

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return StockOperationResult.Success("Stock updated.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StockOperationResult.Fail($"Stock update failed: {ex.Message}");
            }
        }

        public async Task<List<StockOverviewLine>> GetAllStockAsync()
        {
            var setting = await _context.StockSettings.AsNoTracking().FirstOrDefaultAsync(s => s.IsActive);
            var defaultThreshold = setting?.DefaultLowStockThreshold ?? 10;

            var variants = await _context.ProductVariants
                .Where(v => !v.IsDeleted)
                .Include(v => v.Product)
                .OrderBy(v => v.Product!.ProductName).ThenBy(v => v.VariantName)
                .ToListAsync();

            return variants.Select(v =>
            {
                var sellable = v.AvailableStock - v.ReservedStock;
                var threshold = v.LowStockThreshold ?? defaultThreshold;
                var status = sellable <= 0 ? "OutOfStock" : sellable <= threshold ? "LowStock" : "InStock";
                return new StockOverviewLine
                {
                    ProductId = v.ProductId,
                    ProductName = v.Product?.ProductName ?? string.Empty,
                    VariantId = v.Id,
                    VariantName = v.VariantName,
                    AvailableStock = v.AvailableStock,
                    ReservedStock = v.ReservedStock,
                    SellableStock = sellable,
                    IsInStock = v.IsInStock,
                    Status = status
                };
            }).ToList();
        }

        public async Task<List<ProductStockHistory>> GetHistoryAsync(int? productId, int? variantId)
        {
            var query = _context.ProductStockHistories.Include(h => h.Product).Include(h => h.Variant).AsQueryable();
            if (productId.HasValue) query = query.Where(h => h.ProductId == productId.Value);
            if (variantId.HasValue) query = query.Where(h => h.VariantId == variantId.Value);
            return await query.OrderByDescending(h => h.ChangedDate).Take(500).ToListAsync();
        }

        public async Task<List<StockReservation>> GetReservationsAsync(string? status)
        {
            var query = _context.StockReservations
                .Include(r => r.Customer)
                .Include(r => r.Product)
                .Include(r => r.Variant)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<StockReservationStatus>(status, true, out var parsed))
            {
                query = query.Where(r => r.Status == parsed);
            }

            return await query.OrderByDescending(r => r.ReservedAt).Take(500).ToListAsync();
        }

        public async Task<int> ReleaseExpiredReservationsAsync(int? variantId = null)
        {
            var now = DateTime.Now;
            var query = _context.StockReservations.Where(r => r.Status == StockReservationStatus.Reserved && r.ExpiresAt < now);
            if (variantId.HasValue)
            {
                query = query.Where(r => r.VariantId == variantId.Value);
            }
            var expired = await query.ToListAsync();

            var releasedCount = 0;
            foreach (var reservation in expired)
            {
                var before = await ReadVariantAsync(reservation.VariantId);
                if (before == null) continue;

                await ApplyStockDeltaAsync(reservation.VariantId, 0, -reservation.Quantity, false, false, 0);
                var after = await ReadVariantAsync(reservation.VariantId);

                reservation.Status = StockReservationStatus.Expired;
                reservation.ReleasedAt = now;
                reservation.LastModifiedDate = now;

                await _context.ProductStockHistories.AddAsync(new ProductStockHistory
                {
                    ProductId = reservation.ProductId,
                    VariantId = reservation.VariantId,
                    ChangeType = StockChangeType.Expired,
                    QuantityChanged = -reservation.Quantity,
                    PreviousStock = before.ReservedStock,
                    NewStock = after?.ReservedStock ?? Math.Max(0, before.ReservedStock - reservation.Quantity),
                    ReferenceId = reservation.Id,
                    ReferenceType = "Reservation",
                    Remarks = "Reservation expired - stock released.",
                    ChangedDate = now
                });

                releasedCount++;
            }

            if (releasedCount > 0)
            {
                await _context.SaveChangesAsync();
            }
            return releasedCount;
        }
    }
}
