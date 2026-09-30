using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Hiya2.Server.Models
{
    public enum StockReservationStatus
    {
        Reserved,
        Released,
        Expired,
        Converted
    }

    [Table("StockReservation")]
    public class StockReservation
    {
        [Key]
        public long Id { get; set; }

        public long CustomerId { get; set; }

        public long? CartItemId { get; set; }

        public int ProductId { get; set; }

        public int VariantId { get; set; }

        public int Quantity { get; set; }

        public StockReservationStatus Status { get; set; } = StockReservationStatus.Reserved;

        public DateTime ReservedAt { get; set; } = DateTime.Now;

        public DateTime ExpiresAt { get; set; }

        public DateTime? ReleasedAt { get; set; }

        public long? OrderId { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? LastModifiedDate { get; set; }

        [JsonIgnore]
        [ForeignKey("CustomerId")]
        public virtual Customer? Customer { get; set; }

        [JsonIgnore]
        [ForeignKey("ProductId")]
        public virtual Product? Product { get; set; }

        [JsonIgnore]
        [ForeignKey("VariantId")]
        public virtual ProductVariant? Variant { get; set; }
    }
}
