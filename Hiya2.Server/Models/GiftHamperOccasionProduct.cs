using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Hiya2.Server.Models
{
    [Table("GiftHamperOccasionProduct")]
    public class GiftHamperOccasionProduct
    {
        [Key]
        public int Id { get; set; }

        public int OccasionId { get; set; }

        public int ProductId { get; set; }

        public int DisplayOrder { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public bool IsDeleted { get; set; } = false;

        public int? CreatedBy { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        [JsonIgnore]
        [ForeignKey("OccasionId")]
        public virtual GiftHamperOccasion? Occasion { get; set; }

        [ForeignKey("ProductId")]
        public virtual Product? Product { get; set; }
    }
}
