using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Hiya2.Server.Models
{
    [Table("ProductImage")]
    public class ProductImage
    {
        [Key]
        public int Id { get; set; }

        public int ProductId { get; set; }

        // NULL = common product image (shown when a variant has no images of its own).
        // Set = this image belongs to that variant's own gallery.
        public int? VariantId { get; set; }

        public string ImagePath { get; set; } = string.Empty;

        public int DisplayOrder { get; set; } = 0;

        public bool IsPrimary { get; set; } = false;

        public bool IsActive { get; set; } = true;

        public bool IsDeleted { get; set; } = false;

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        [JsonIgnore]
        [ForeignKey("ProductId")]
        public virtual Product? Product { get; set; }

        [JsonIgnore]
        [ForeignKey("VariantId")]
        public virtual ProductVariant? Variant { get; set; }
    }
}
