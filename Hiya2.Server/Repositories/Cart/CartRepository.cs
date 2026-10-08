using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;
using Hiya2.Server.Repositories.Stock;

namespace Hiya2.Server.Repositories.Cart
{
    public class CartRepository : ICartRepository
    {
        private readonly DataContext _context;
        private readonly IStockService _stockService;

        public CartRepository(DataContext context, IStockService stockService)
        {
            _context = context;
            _stockService = stockService;
        }

        private static decimal ResolveUnitPrice(Models.Product product, ProductVariant? variant)
        {
            if (variant != null)
            {
                return variant.Price;
            }
            return product.DiscountPrice ?? product.BasePrice;
        }

        public async Task<List<CartLine>> GetCartAsync(long customerId)
        {
            var items = await _context.CartItems
                .Where(c => c.CustomerId == customerId && !c.IsDeleted && c.IsActive)
                .Include(c => c.Product)
                .Include(c => c.Variant)
                .OrderByDescending(c => c.Id)
                .ToListAsync();

            var lines = new List<CartLine>();
            foreach (var item in items)
            {
                if (item.Product == null)
                {
                    continue;
                }
                var unitPrice = ResolveUnitPrice(item.Product, item.Variant);
                lines.Add(new CartLine
                {
                    Item = item,
                    Product = item.Product,
                    Variant = item.Variant,
                    UnitPrice = unitPrice,
                    LineTotal = unitPrice * item.Quantity
                });
            }
            return lines;
        }

        public async Task<CartOperationResult> AddOrUpdateItemAsync(long customerId, int productId, int? variantId, string? packingType, int quantity)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var existing = await _context.CartItems.FirstOrDefaultAsync(c =>
                    c.CustomerId == customerId &&
                    c.ProductId == productId &&
                    c.VariantId == variantId &&
                    c.PackingType == packingType &&
                    !c.IsDeleted);

                var previousQuantity = existing?.Quantity ?? 0;
                var newQuantity = previousQuantity + quantity;

                // Products without a variant aren't stock-tracked today (a pre-existing gap -
                // see plan §1/§15) - skip reservation for those lines only.
                if (variantId.HasValue)
                {
                    var delta = newQuantity - previousQuantity;
                    if (delta > 0)
                    {
                        var reserveResult = await _stockService.ReserveAsync(customerId, productId, variantId.Value, existing?.Id, delta);
                        if (!reserveResult.IsSuccess)
                        {
                            await transaction.RollbackAsync();
                            return new CartOperationResult { IsSuccess = false, Message = reserveResult.Message };
                        }
                    }
                    else if (delta < 0)
                    {
                        await _stockService.ReleaseAsync(customerId, productId, variantId.Value, existing?.Id, -delta);
                    }
                }

                CartItem item;
                if (existing != null)
                {
                    existing.Quantity = newQuantity;
                    existing.IsActive = true;
                    existing.LastModifiedDate = DateTime.Now;

                    if (existing.Quantity <= 0)
                    {
                        existing.IsDeleted = true;
                        existing.IsActive = false;
                    }
                    item = existing;
                }
                else
                {
                    if (newQuantity <= 0)
                    {
                        newQuantity = 1;
                        if (variantId.HasValue)
                        {
                            await _stockService.ReserveAsync(customerId, productId, variantId.Value, null, 1);
                        }
                    }

                    item = new CartItem
                    {
                        CustomerId = customerId,
                        ProductId = productId,
                        VariantId = variantId,
                        PackingType = packingType,
                        Quantity = newQuantity,
                        IsActive = true,
                        IsDeleted = false,
                        CreatedDate = DateTime.Now
                    };
                    await _context.CartItems.AddAsync(item);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return new CartOperationResult { IsSuccess = true, Item = item };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return new CartOperationResult { IsSuccess = false, Message = $"Could not update cart: {ex.Message}" };
            }
        }

        public async Task<bool> RemoveItemAsync(long customerId, long cartItemId)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var item = await _context.CartItems.FirstOrDefaultAsync(c =>
                    c.Id == cartItemId && c.CustomerId == customerId && !c.IsDeleted);

                if (item == null)
                {
                    await transaction.RollbackAsync();
                    return false;
                }

                if (item.VariantId.HasValue)
                {
                    await _stockService.ReleaseAsync(customerId, item.ProductId, item.VariantId.Value, item.Id, item.Quantity);
                }

                item.IsDeleted = true;
                item.IsActive = false;
                item.LastModifiedDate = DateTime.Now;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                return false;
            }
        }

        public async Task<int> MergeGuestCartAsync(long customerId, List<(int ProductId, int? VariantId, string? PackingType, int Quantity)> items)
        {
            int merged = 0;
            foreach (var line in items)
            {
                if (line.Quantity <= 0)
                {
                    continue;
                }
                var result = await AddOrUpdateItemAsync(customerId, line.ProductId, line.VariantId, line.PackingType, line.Quantity);
                if (result.IsSuccess)
                {
                    merged++;
                }
            }
            return merged;
        }

        public async Task<decimal> GetSubtotalAsync(long customerId)
        {
            var lines = await GetCartAsync(customerId);
            return lines.Sum(l => l.LineTotal);
        }

        public async Task ClearCartAsync(long customerId)
        {
            var items = await _context.CartItems
                .Where(c => c.CustomerId == customerId && !c.IsDeleted)
                .ToListAsync();

            foreach (var item in items)
            {
                item.IsDeleted = true;
                item.IsActive = false;
                item.LastModifiedDate = DateTime.Now;
            }

            await _context.SaveChangesAsync();
        }
    }
}
