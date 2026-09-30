using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Hiya2.Server.Models
{
    public enum StockChangeType
    {
        StockIn,
        StockOut,
        Reserved,
        Released,
        Sold,
        Returned,
        Adjustment,
        Expired
    }

    [Table("ProductStockHistory")]
    public class ProductStockHistory
    {
        [Key]
        public long Id { get; set; }

        public int ProductId { get; set; }

        public int VariantId { get; set; }

        public StockChangeType ChangeType { get; set; }

        public int QuantityChanged { get; set; }

        public int PreviousStock { get; set; }

        public int NewStock { get; set; }

        public long? ReferenceId { get; set; }

        public string? ReferenceType { get; set; }

        public string? Remarks { get; set; }

        public long? ChangedBy { get; set; }

        public DateTime ChangedDate { get; set; } = DateTime.Now;

        [JsonIgnore]
        [ForeignKey("ProductId")]
        public virtual Product? Product { get; set; }

        [JsonIgnore]
        [ForeignKey("VariantId")]
        public virtual ProductVariant? Variant { get; set; }
    }
}
