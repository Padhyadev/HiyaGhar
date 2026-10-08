using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    public enum OrderStatus
    {
        Placed,
        Confirmed,
        Processing,
        Packed,
        Shipped,
        OutForDelivery,
        Delivered,
        CancelRequested,
        Cancelled,
        ReturnRequested,
        Returned,
        RefundInitiated,
        Refunded,
        CancelRejected
    }

    public enum OrderPaymentStatus
    {
        Pending,
        Paid,
        Refunded
    }

    [Table("Order")]
    public class Order
    {
        [Key]
        public long Id { get; set; }

        public string OrderNumber { get; set; } = string.Empty;

        public long CustomerId { get; set; }

        public DateTime OrderDate { get; set; } = DateTime.Now;

        public decimal Subtotal { get; set; }

        public decimal DiscountAmount { get; set; } = 0;

        public string? CouponCode { get; set; }

        public int CoinsUsed { get; set; } = 0;

        public decimal CoinDiscountAmount { get; set; } = 0;

        public decimal DeliveryFee { get; set; } = 0;

        public decimal TotalAmount { get; set; }

        public OrderStatus OrderStatus { get; set; } = OrderStatus.Placed;

        public OrderPaymentStatus PaymentStatus { get; set; } = OrderPaymentStatus.Pending;

        // Only "COD" is used for now; free-text so a future payment gateway
        // can add a new value without a schema change.
        public string PaymentMode { get; set; } = "COD";

        // Address snapshot - copied from CustomerAddress at checkout time so
        // order history stays correct even if the address is later edited/deleted.
        public long? CustomerAddressId { get; set; }

        public string RecipientName { get; set; } = string.Empty;

        public string AddressLine1 { get; set; } = string.Empty;

        public string? AddressLine2 { get; set; }

        public string City { get; set; } = string.Empty;

        public string State { get; set; } = string.Empty;

        public string PostalCode { get; set; } = string.Empty;

        public string Country { get; set; } = "India";

        public string MobileNo { get; set; } = string.Empty;

        public string? CancelReason { get; set; }

        public DateTime? CancelledDate { get; set; }

        public string? CourierName { get; set; }

        public string? TrackingNumber { get; set; }

        public string? TrackingUrl { get; set; }

        public string? RazorpayOrderId { get; set; }

        public string? RazorpayPaymentId { get; set; }

        public string? RazorpaySignature { get; set; }

        public bool IsActive { get; set; } = true;

        public bool IsDeleted { get; set; } = false;

        public long? CreatedBy { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public long? LastModifiedBy { get; set; }

        public DateTime? LastModifiedDate { get; set; }

        public virtual ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    }
}
