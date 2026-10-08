using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Hiya2.Server.Models
{
    [Table("OrderItem")]
    public class OrderItem
    {
        [Key]
        public long Id { get; set; }

        public long OrderId { get; set; }

        public int ProductId { get; set; }

        public int? VariantId { get; set; }

        // Snapshots so an order's line items stay accurate even if the
        // product/variant is later renamed or deleted.
        public string ProductName { get; set; } = string.Empty;

        public string? VariantName { get; set; }

        public decimal UnitPrice { get; set; }

        public int Quantity { get; set; }

        public decimal TotalPrice { get; set; }

        [JsonIgnore]
        [ForeignKey("OrderId")]
        public virtual Order? Order { get; set; }
    }
}
