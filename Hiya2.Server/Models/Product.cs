using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    [Table("Product")]
    public class Product
    {
        [Key]
        public int Id { get; set; }

        public int CategoryId { get; set; }

        public string ProductName { get; set; } = string.Empty;

        public string? ShortDescription { get; set; }

        public string? FullDescription { get; set; }

        public string? MainImagePath { get; set; }

        public decimal BasePrice { get; set; }

        public decimal? DiscountPrice { get; set; }

        public decimal Rating { get; set; } = 5.0m;

        public int ReviewCount { get; set; } = 0;

        public bool IsFeatured { get; set; } = false;

        public bool IsActive { get; set; } = true;

        public bool IsDeleted { get; set; } = false;

        public int CreatedBy { get; set; } = 1;

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public int? LastModifiedBy { get; set; }

        public DateTime? LastModifiedDate { get; set; }

        [ForeignKey("CategoryId")]
        public virtual Category? Category { get; set; }

        public virtual ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();

        public virtual ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    }
}
