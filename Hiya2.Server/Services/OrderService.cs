using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;
using Hiya2.Server.Repositories.Cart;
using Hiya2.Server.Repositories.Stock;

namespace Hiya2.Server.Services
{
    public class OrderService : IOrderService
    {
        private readonly DataContext _context;
        private readonly ICartRepository _cartRepository;
        private readonly ICouponService _couponService;
        private readonly IRewardService _rewardService;
        private readonly IEmailService _emailService;
        private readonly IStockService _stockService;

        // Which statuses an order may move to from a given status. Mirrors the
        // reference project's status machine, simplified to skip the separate
        // cancel-request/cancel-reject admin approval loop.
        private static readonly Dictionary<OrderStatus, OrderStatus[]> AllowedTransitions = new()
        {
            [OrderStatus.Placed] = new[] { OrderStatus.Confirmed, OrderStatus.Processing, OrderStatus.Packed, OrderStatus.Shipped, OrderStatus.OutForDelivery, OrderStatus.Delivered, OrderStatus.Cancelled },
            [OrderStatus.Confirmed] = new[] { OrderStatus.Processing, OrderStatus.Packed, OrderStatus.Shipped, OrderStatus.OutForDelivery, OrderStatus.Delivered, OrderStatus.Cancelled },
            [OrderStatus.Processing] = new[] { OrderStatus.Packed, OrderStatus.Shipped, OrderStatus.OutForDelivery, OrderStatus.Delivered, OrderStatus.Cancelled },
            [OrderStatus.Packed] = new[] { OrderStatus.Shipped, OrderStatus.OutForDelivery, OrderStatus.Delivered, OrderStatus.Cancelled },
            [OrderStatus.Shipped] = new[] { OrderStatus.OutForDelivery, OrderStatus.Delivered },
            [OrderStatus.OutForDelivery] = new[] { OrderStatus.Delivered },
            [OrderStatus.Delivered] = new[] { OrderStatus.Returned },
        };

        public OrderService(DataContext context, ICartRepository cartRepository, ICouponService couponService, IRewardService rewardService, IEmailService emailService, IStockService stockService)
        {
            _context = context;
            _cartRepository = cartRepository;
            _couponService = couponService;
            _rewardService = rewardService;
            _emailService = emailService;
            _stockService = stockService;
        }

        private static string BuildProductRowsHtml(IEnumerable<OrderItem> items)
        {
            var rows = "";
            var srNo = 1;
            foreach (var item in items)
            {
                var variantHtml = !string.IsNullOrWhiteSpace(item.VariantName)
                    ? $"<div style='font-size: 13px; color: #64748b; margin-top: 4px;'>Variant: {item.VariantName}</div>"
                    : "";

                rows += $@"
        <div style='background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin-bottom: 16px;'>
          <div style='font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px;'>PRODUCT</div>
          
          <table role='presentation' cellpadding='0' cellspacing='0' width='100%' style='border-collapse: collapse;'>
            <tr>
              <td style='vertical-align: top;'>
                <div style='font-size: 15px; font-weight: 700; color: #0f172a; line-height: 1.3;'>{srNo}. {item.ProductName}</div>
                {variantHtml}
              </td>
            </tr>
          </table>

          <div style='border-top: 1px solid #f1f5f9; margin-top: 14px; padding-top: 12px;'>
            <table role='presentation' cellpadding='0' cellspacing='0' width='100%'>
              <tr>
                <td style='width: 50%; vertical-align: top;'>
                  <div style='font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;'>QTY</div>
                  <div style='font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 4px;'>{item.Quantity}</div>
                </td>
                <td style='width: 50%; vertical-align: top;'>
                  <div style='font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;'>PRICE</div>
                  <div style='font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 4px;'>₹{item.TotalPrice:N2}</div>
                </td>
              </tr>
            </table>
          </div>
        </div>";
                srNo++;
            }
            return rows;
        }

        // Hardcoded fallback only - used if the LovMaster "OrderStatus" row for
        // this code is missing/deactivated, so a label always renders even if
        // the lookup table is misconfigured.
        private static string FormatStatusFallback(OrderStatus status) => status switch
        {
            OrderStatus.OutForDelivery => "Out for Delivery",
            OrderStatus.CancelRequested => "Cancellation Requested",
            OrderStatus.CancelRejected => "Cancellation Rejected",
            OrderStatus.ReturnRequested => "Return Requested",
            OrderStatus.RefundInitiated => "Refund Initiated",
            _ => status.ToString()
        };

        // Resolves the admin-editable display label for an order status from
        // LovMaster (LovColumn="OrderStatus", LovCode=<enum name>). This is
        // the whole point of the LOV table: an admin can rename what a
        // customer/admin sees for a status without any code change - only
        // the DB row's LovDesc changes.
        private async Task<string> FormatStatusForDisplayAsync(OrderStatus status)
        {
            var code = status.ToString();
            var lov = await _context.LovMasters.FirstOrDefaultAsync(l =>
                l.LovColumn == "OrderStatus" && l.LovCode == code && l.IsActive && !l.IsDeleted);

            return lov?.LovDesc ?? FormatStatusFallback(status);
        }

        private async Task<decimal> CalculateDeliveryFeeAsync(decimal subtotal, string deliveryType = "standard")
        {
            var setting = await _context.ShippingSettings.FirstOrDefaultAsync(s => s.IsActive);
            var threshold = setting?.FreeShippingThreshold ?? 500m;
            var standardPrice = setting?.StandardShippingPrice ?? 49m;
            var expressPrice = setting?.ExpressShippingPrice ?? 99m;
            var enableFree = setting?.EnableFreeShipping ?? true;

            var isExpress = string.Equals(deliveryType, "express", StringComparison.OrdinalIgnoreCase);

            // Express delivery is never free even if subtotal exceeds free-shipping threshold.
            if (isExpress)
            {
                return expressPrice;
            }

            if (enableFree && subtotal >= threshold)
            {
                return 0m;
            }
            return standardPrice;
        }

        public async Task<OrderResult> CreateOrderFromCartAsync(
            long customerId, 
            long customerAddressId, 
            string? couponCode, 
            int useRewardCoins,
            string paymentMode = "COD",
            OrderPaymentStatus paymentStatus = OrderPaymentStatus.Pending,
            string? razorpayOrderId = null,
            string? razorpayPaymentId = null,
            string? razorpaySignature = null,
            string deliveryType = "standard")
        {
            var cartLines = await _cartRepository.GetCartAsync(customerId);
            if (cartLines.Count == 0)
            {
                return new OrderResult { IsSuccess = false, Message = "Your cart is empty." };
            }

            var address = await _context.CustomerAddresses.FirstOrDefaultAsync(a =>
                a.Id == customerAddressId && a.CustomerId == customerId && !a.IsDeleted);
            if (address == null)
            {
                return new OrderResult { IsSuccess = false, Message = "Selected delivery address was not found." };
            }

            var subtotal = cartLines.Sum(l => l.LineTotal);

            decimal discountAmount = 0;
            Coupon? appliedCoupon = null;
            if (!string.IsNullOrWhiteSpace(couponCode))
            {
                var couponResult = await _couponService.ValidateAsync(couponCode, customerId, subtotal);
                if (!couponResult.IsValid)
                {
                    return new OrderResult { IsSuccess = false, Message = couponResult.Message };
                }
                discountAmount = couponResult.DiscountAmount;
                appliedCoupon = couponResult.Coupon;
            }

            var deliveryFee = await CalculateDeliveryFeeAsync(subtotal, deliveryType);
            var amountAfterDiscount = subtotal - discountAmount + deliveryFee;

            decimal coinDiscount = 0;
            if (useRewardCoins > 0)
            {
                var coinResult = await _rewardService.ValidateCoinUsageAsync(customerId, useRewardCoins, amountAfterDiscount);
                if (!coinResult.IsValid)
                {
                    return new OrderResult { IsSuccess = false, Message = coinResult.Message };
                }
                coinDiscount = coinResult.CoinDiscountAmount;
            }

            var totalAmount = amountAfterDiscount - coinDiscount;
            if (totalAmount < 0)
            {
                totalAmount = 0;
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var order = new Order
                {
                    OrderNumber = "ORD-" + DateTime.Now.ToString("yyyyMMddHHmmssfff"),
                    CustomerId = customerId,
                    OrderDate = DateTime.Now,
                    Subtotal = subtotal,
                    DiscountAmount = discountAmount,
                    CouponCode = appliedCoupon?.Code,
                    CoinsUsed = useRewardCoins > 0 ? useRewardCoins : 0,
                    CoinDiscountAmount = coinDiscount,
                    DeliveryFee = deliveryFee,
                    TotalAmount = totalAmount,
                    OrderStatus = OrderStatus.Placed,
                    PaymentStatus = paymentStatus,
                    PaymentMode = paymentMode,
                    RazorpayOrderId = razorpayOrderId,
                    RazorpayPaymentId = razorpayPaymentId,
                    RazorpaySignature = razorpaySignature,
                    CustomerAddressId = address.Id,
                    RecipientName = address.CustomerName ?? string.Empty,
                    AddressLine1 = address.AddressLine1,
                    AddressLine2 = address.AddressLine2,
                    City = address.City,
                    State = address.State,
                    PostalCode = address.PostalCode,
                    Country = address.Country,
                    MobileNo = address.MobileNo ?? string.Empty,
                    IsActive = true,
                    IsDeleted = false,
                    CreatedBy = customerId,
                    CreatedDate = DateTime.Now
                };

                foreach (var line in cartLines)
                {
                    order.Items.Add(new OrderItem
                    {
                        ProductId = line.Product.Id,
                        VariantId = line.Variant?.Id,
                        ProductName = line.Product.ProductName,
                        VariantName = line.Variant?.VariantName,
                        UnitPrice = line.UnitPrice,
                        Quantity = line.Item.Quantity,
                        TotalPrice = line.LineTotal
                    });
                }

                await _context.Orders.AddAsync(order);
                await _context.SaveChangesAsync();

                // Convert each variant-tracked line's existing reservation (made at
                // add-to-cart) into a sold movement. Do NOT reserve again here - the
                // units were already held since the item entered the cart.
                foreach (var line in cartLines)
                {
                    if (line.Variant == null)
                    {
                        continue;
                    }

                    var conversion = await _stockService.ConvertToSoldAsync(
                        customerId, line.Product.Id, line.Variant.Id, line.Item.Id, order.Id, line.Item.Quantity, customerId);

                    if (!conversion.IsSuccess)
                    {
                        await transaction.RollbackAsync();
                        return new OrderResult
                        {
                            IsSuccess = false,
                            Message = conversion.Message ?? $"'{line.Product.ProductName}' does not have enough stock available."
                        };
                    }
                }
                await _context.SaveChangesAsync();

                if (appliedCoupon != null)
                {
                    await _context.CouponUsages.AddAsync(new CouponUsage
                    {
                        CouponId = appliedCoupon.Id,
                        CustomerId = customerId,
                        OrderId = order.Id,
                        DiscountAmount = discountAmount,
                        UsedDate = DateTime.Now
                    });
                }

                await _context.OrderStatusHistories.AddAsync(new OrderStatusHistory
                {
                    OrderId = order.Id,
                    OldStatus = null,
                    NewStatus = OrderStatus.Placed,
                    Remarks = "Order placed successfully.",
                    ChangedDate = DateTime.Now,
                    ChangedBy = customerId
                });

                await _context.SaveChangesAsync();

                if (order.CoinsUsed > 0)
                {
                    await _rewardService.DebitCoinsAsync(customerId, order.CoinsUsed, order.Id);
                }

                await _cartRepository.ClearCartAsync(customerId);

                await transaction.CommitAsync();

                await SendOrderPlacedEmailAsync(order);

                return new OrderResult
                {
                    IsSuccess = true,
                    Message = "Order placed successfully.",
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    Subtotal = order.Subtotal,
                    DiscountAmount = order.DiscountAmount,
                    CoinDiscountAmount = order.CoinDiscountAmount,
                    DeliveryFee = order.DeliveryFee,
                    TotalAmount = order.TotalAmount
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return new OrderResult { IsSuccess = false, Message = $"Checkout failed: {ex.Message}" };
            }
        }

        private async Task SendOrderPlacedEmailAsync(Order order)
        {
            try
            {
                var customer = await _context.Customers.FirstOrDefaultAsync(c => c.CustomerId == order.CustomerId);
                if (customer == null || string.IsNullOrWhiteSpace(customer.Email))
                {
                    Console.WriteLine($"[EMAIL NOTICE] Customer email missing or not found for customer ID {order.CustomerId}");
                }
                else
                {
                    var templateData = new Dictionary<string, string>
                    {
                        ["customerName"] = $"{customer.FirstName} {customer.LastName}".Trim(),
                        ["orderNumber"] = order.OrderNumber,
                        ["productRows"] = BuildProductRowsHtml(order.Items),
                        ["subtotal"] = order.Subtotal.ToString("N2"),
                        ["discountAmount"] = order.DiscountAmount.ToString("N2"),
                        ["coinDiscountAmount"] = order.CoinDiscountAmount.ToString("N2"),
                        ["deliveryFee"] = order.DeliveryFee.ToString("N2"),
                        ["totalAmount"] = order.TotalAmount.ToString("N2")
                    };

                    var result = await _emailService.SendEmailAsync(customer.Email, $"Order Confirmed - {order.OrderNumber}", "order_placed", templateData);
                    Console.WriteLine($"[EMAIL Customer Order Placed Result]: Success={result.IsSuccess}, Message={result.Message}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EMAIL ERROR SendOrderPlacedEmailAsync]: {ex}");
            }

            await SendAdminOrderPlacedEmailAsync(order);
        }

        private async Task SendAdminOrderPlacedEmailAsync(Order order)
        {
            try
            {
                var adminRecipients = _emailService.GetAdminNotificationRecipients();
                if (string.IsNullOrWhiteSpace(adminRecipients))
                {
                    Console.WriteLine("[EMAIL NOTICE] Admin recipients list is empty.");
                    return;
                }

                var customer = await _context.Customers.FirstOrDefaultAsync(c => c.CustomerId == order.CustomerId);

                var templateData = new Dictionary<string, string>
                {
                    ["orderNumber"] = order.OrderNumber,
                    ["customerName"] = customer != null ? $"{customer.FirstName} {customer.LastName}".Trim() : "Valued Customer",
                    ["customerEmail"] = customer?.Email ?? "-",
                    ["customerMobile"] = customer?.MobileNo ?? "-",
                    ["orderDate"] = order.OrderDate.ToString("dd MMM yyyy, hh:mm tt"),
                    ["productRows"] = BuildProductRowsHtml(order.Items),
                    ["totalAmount"] = order.TotalAmount.ToString("N2")
                };

                var result = await _emailService.SendEmailAsync(adminRecipients, $"New Order - {order.OrderNumber}", "admin_order_placed", templateData);
                Console.WriteLine($"[EMAIL Admin Order Placed Result]: Success={result.IsSuccess}, Message={result.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EMAIL ERROR SendAdminOrderPlacedEmailAsync]: {ex}");
            }
        }

        private async Task SendOrderStatusChangedEmailAsync(Order order, OrderStatus newStatus)
        {
            try
            {
                var customer = await _context.Customers.FirstOrDefaultAsync(c => c.CustomerId == order.CustomerId);
                if (customer == null || string.IsNullOrWhiteSpace(customer.Email))
                {
                    return;
                }

                var items = await _context.OrderItems.Where(i => i.OrderId == order.Id).ToListAsync();
                var templateData = new Dictionary<string, string>
                {
                    ["customerName"] = $"{customer.FirstName} {customer.LastName}".Trim(),
                    ["orderNumber"] = order.OrderNumber,
                    ["productName"] = string.Join(", ", items.Select(i => i.ProductName)),
                    ["newStatus"] = await FormatStatusForDisplayAsync(newStatus)
                };

                await _emailService.SendEmailAsync(customer.Email, $"Order Update - {order.OrderNumber}", "order_status_change", templateData);
            }
            catch
            {
                // Email failures must never surface as a status-update failure - the change is already committed.
            }

            await SendAdminOrderStatusChangedEmailAsync(order, newStatus);
        }

        private async Task SendAdminOrderStatusChangedEmailAsync(Order order, OrderStatus newStatus)
        {
            try
            {
                var adminRecipients = _emailService.GetAdminNotificationRecipients();
                if (string.IsNullOrWhiteSpace(adminRecipients))
                {
                    return;
                }

                var customer = await _context.Customers.FirstOrDefaultAsync(c => c.CustomerId == order.CustomerId);

                var statusLabel = await FormatStatusForDisplayAsync(newStatus);
                var templateData = new Dictionary<string, string>
                {
                    ["orderNumber"] = order.OrderNumber,
                    ["customerName"] = customer != null ? $"{customer.FirstName} {customer.LastName}".Trim() : "Unknown",
                    ["customerEmail"] = customer?.Email ?? "-",
                    ["newStatus"] = statusLabel,
                    ["totalAmount"] = order.TotalAmount.ToString("N2")
                };

                await _emailService.SendEmailAsync(adminRecipients, $"Order {statusLabel} - {order.OrderNumber}", "admin_order_status_change", templateData);
            }
            catch
            {
                // Admin notification failures must never surface as a status-update failure.
            }
        }

        public async Task<List<Order>> GetOrdersByCustomerAsync(long customerId)
        {
            return await _context.Orders
                .Where(o => o.CustomerId == customerId && !o.IsDeleted)
                .Include(o => o.Items)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
        }

        public async Task<Order?> GetOrderByIdAsync(long orderId, long? customerId = null)
        {
            var query = _context.Orders.Where(o => o.Id == orderId && !o.IsDeleted);
            if (customerId.HasValue)
            {
                query = query.Where(o => o.CustomerId == customerId.Value);
            }
            return await query.Include(o => o.Items).FirstOrDefaultAsync();
        }

        public async Task<OrderResult> CancelOrderAsync(long orderId, long customerId, string reason)
        {
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId && o.CustomerId == customerId && !o.IsDeleted);
            if (order == null)
            {
                return new OrderResult { IsSuccess = false, Message = "Order not found." };
            }

            if (string.IsNullOrWhiteSpace(reason))
            {
                return new OrderResult { IsSuccess = false, Message = "Please provide a cancellation reason." };
            }

            return await ChangeStatusInternalAsync(order, OrderStatus.Cancelled, reason, customerId);
        }

        public async Task<List<Order>> GetAllOrdersAdminAsync(int page, int pageSize)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 200) pageSize = 50;

            return await _context.Orders
                .Where(o => !o.IsDeleted)
                .Include(o => o.Items)
                .OrderByDescending(o => o.OrderDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<OrderResult> UpdateOrderStatusAsync(long orderId, OrderStatus newStatus, string? reason, long? changedBy, string? courierName = null, string? trackingNumber = null, string? trackingUrl = null)
        {
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId && !o.IsDeleted);
            if (order == null)
            {
                return new OrderResult { IsSuccess = false, Message = "Order not found." };
            }

            if ((newStatus == OrderStatus.Cancelled || newStatus == OrderStatus.Returned) && string.IsNullOrWhiteSpace(reason))
            {
                return new OrderResult { IsSuccess = false, Message = "A reason is required for this status change." };
            }

            return await ChangeStatusInternalAsync(order, newStatus, reason, changedBy, courierName, trackingNumber, trackingUrl);
        }

        public async Task<OrderResult> UpdateOrderTrackingAsync(long orderId, string courierName, string trackingNumber, string? trackingUrl, long? changedBy)
        {
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId && !o.IsDeleted);
            if (order == null)
            {
                return new OrderResult { IsSuccess = false, Message = "Order not found." };
            }

            if (string.IsNullOrWhiteSpace(courierName))
            {
                return new OrderResult { IsSuccess = false, Message = "Courier name is required." };
            }

            if (string.IsNullOrWhiteSpace(trackingNumber))
            {
                return new OrderResult { IsSuccess = false, Message = "Tracking / AWB number is required." };
            }

            order.CourierName = courierName.Trim();
            order.TrackingNumber = trackingNumber.Trim();
            order.TrackingUrl = string.IsNullOrWhiteSpace(trackingUrl) ? null : trackingUrl.Trim();
            order.LastModifiedDate = DateTime.Now;
            order.LastModifiedBy = changedBy;

            await _context.SaveChangesAsync();
            return new OrderResult { IsSuccess = true, Message = "Tracking details updated successfully.", OrderId = order.Id, OrderNumber = order.OrderNumber };
        }

        private async Task<OrderResult> ChangeStatusInternalAsync(Order order, OrderStatus newStatus, string? reason, long? changedBy, string? courierName = null, string? trackingNumber = null, string? trackingUrl = null)
        {
            if (!AllowedTransitions.TryGetValue(order.OrderStatus, out var allowed) || !allowed.Contains(newStatus))
            {
                return new OrderResult { IsSuccess = false, Message = $"Cannot move an order from {order.OrderStatus} to {newStatus}." };
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var oldStatus = order.OrderStatus;
                order.OrderStatus = newStatus;
                order.LastModifiedDate = DateTime.Now;
                order.LastModifiedBy = changedBy;

                if (newStatus == OrderStatus.Shipped)
                {
                    if (!string.IsNullOrWhiteSpace(courierName)) order.CourierName = courierName.Trim();
                    if (!string.IsNullOrWhiteSpace(trackingNumber)) order.TrackingNumber = trackingNumber.Trim();
                    if (!string.IsNullOrWhiteSpace(trackingUrl)) order.TrackingUrl = trackingUrl.Trim();
                }

                if (newStatus == OrderStatus.Cancelled || newStatus == OrderStatus.Returned)
                {
                    order.CancelReason = reason;
                    order.CancelledDate = DateTime.Now;

                    // Restock items (audited - see IStockService.RestockForCancelOrReturnAsync).
                    var items = await _context.OrderItems.Where(i => i.OrderId == order.Id).ToListAsync();
                    foreach (var item in items)
                    {
                        if (item.VariantId == null) continue;
                        await _stockService.RestockForCancelOrReturnAsync(
                            item.ProductId, item.VariantId.Value, item.Quantity, order.Id,
                            isReturn: newStatus == OrderStatus.Returned, actorId: changedBy);
                    }
                }

                if (newStatus == OrderStatus.Delivered)
                {
                    order.PaymentStatus = OrderPaymentStatus.Paid;
                }

                await _context.OrderStatusHistories.AddAsync(new OrderStatusHistory
                {
                    OrderId = order.Id,
                    OldStatus = oldStatus,
                    NewStatus = newStatus,
                    Remarks = reason,
                    ChangedDate = DateTime.Now,
                    ChangedBy = changedBy
                });

                await _context.SaveChangesAsync();

                if (newStatus == OrderStatus.Delivered)
                {
                    await _rewardService.CreditForDeliveredOrderAsync(order.CustomerId, order.Id, order.TotalAmount);
                }
                else if (newStatus == OrderStatus.Cancelled || newStatus == OrderStatus.Returned)
                {
                    await _rewardService.RefundCoinsForOrderAsync(order.Id);
                }

                await transaction.CommitAsync();

                // Status-change email notifications disabled per request - do not send to customer or admin.
                // await SendOrderStatusChangedEmailAsync(order, newStatus);

                return new OrderResult { IsSuccess = true, Message = "Order status updated.", OrderId = order.Id, OrderNumber = order.OrderNumber };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return new OrderResult { IsSuccess = false, Message = $"Status update failed: {ex.Message}" };
            }
        }

        public async Task<OrderResult> UpdatePaymentStatusAsync(long orderId, OrderPaymentStatus newPaymentStatus, long? changedBy)
        {
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
            if (order == null)
            {
                return new OrderResult { IsSuccess = false, Message = "Order not found." };
            }

            order.PaymentStatus = newPaymentStatus;
            order.LastModifiedDate = DateTime.Now;
            order.LastModifiedBy = changedBy;

            await _context.SaveChangesAsync();
            return new OrderResult { IsSuccess = true, Message = "Payment status updated.", OrderId = order.Id, OrderNumber = order.OrderNumber };
        }
    }
}
