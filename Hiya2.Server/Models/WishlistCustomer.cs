using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Hiya2.Server.Models
{
    [Table("WishlistCustomer")]
    public class WishlistCustomer
    {
        [Key]
        public long Id { get; set; }

        public long CustomerId { get; set; }

        public int ProductId { get; set; }

        public int? VariantId { get; set; }

        public string? PackingType { get; set; }

        public bool IsActive { get; set; } = true;

        public bool IsDeleted { get; set; } = false;

        public long? CreatedBy { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public long? LastModifiedBy { get; set; }

        public DateTime? LastModifiedDate { get; set; }

        [JsonIgnore]
        [ForeignKey("CustomerId")]
        public virtual Customer? Customer { get; set; }

        [ForeignKey("ProductId")]
        public virtual Product? Product { get; set; }

        [ForeignKey("VariantId")]
        public virtual ProductVariant? Variant { get; set; }
    }
}
