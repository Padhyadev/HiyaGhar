using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Hiya2.Server.Models
{
    [Table("Review")]
    public class Review
    {
        [Key]
        public long Id { get; set; }

        public long CustomerId { get; set; }

        public int ProductId { get; set; }

        public int Rating { get; set; }

        public string ReviewText { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public bool IsDeleted { get; set; } = false;

        public long? CreatedBy { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public long? LastModifiedBy { get; set; }

        public DateTime? LastModifiedDate { get; set; }

        [JsonIgnore]
        [ForeignKey("CustomerId")]
        public virtual Customer? Customer { get; set; }

        [JsonIgnore]
        [ForeignKey("ProductId")]
        public virtual Product? Product { get; set; }
    }
}
