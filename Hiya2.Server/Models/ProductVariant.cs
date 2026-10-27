using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Hiya2.Server.Models
{
    [Table("ProductVariant")]
    public class ProductVariant
    {
        [Key]
        public int Id { get; set; }

        public int ProductId { get; set; }

        public string VariantName { get; set; } = string.Empty;

        public string SKU { get; set; } = string.Empty;

        public decimal Price { get; set; }

        public decimal? OriginalPrice { get; set; }

        public int AvailableStock { get; set; } = 0;

        public int ReservedStock { get; set; } = 0;

        public int? LowStockThreshold { get; set; }

        public bool IsInStock { get; set; } = true;

        public bool IsDefault { get; set; } = false;

        public bool IsActive { get; set; } = true;

        public bool IsDeleted { get; set; } = false;

        public int CreatedBy { get; set; } = 1;

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public int? LastModifiedBy { get; set; }

        public DateTime? LastModifiedDate { get; set; }

        [JsonIgnore]
        [ForeignKey("ProductId")]
        public virtual Product? Product { get; set; }

        [JsonIgnore]
        public virtual ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();

        // Primary image of this variant's own gallery, or null if it has none (callers then
        // fall back to Product.MainImagePath). Requires Images to be loaded.
        public string? GetPrimaryImagePath() => Images
            .Where(i => !i.IsDeleted)
            .OrderByDescending(i => i.IsPrimary).ThenBy(i => i.DisplayOrder)
            .Select(i => i.ImagePath)
            .FirstOrDefault();
    }
}
