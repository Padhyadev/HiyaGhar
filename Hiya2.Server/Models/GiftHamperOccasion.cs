using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    [Table("GiftHamperOccasion")]
    public class GiftHamperOccasion
    {
        [Key]
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Slug { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string? BannerImagePath { get; set; }

        public int DisplayOrder { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public bool IsDeleted { get; set; } = false;

        public int CreatedBy { get; set; } = 1;

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public int? LastModifiedBy { get; set; }

        public DateTime? LastModifiedDate { get; set; }

        public virtual ICollection<GiftHamperOccasionProduct> Products { get; set; } = new List<GiftHamperOccasionProduct>();
    }
}
