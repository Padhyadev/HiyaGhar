using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Hiya2.Server.Models
{
    [Table("HomePageComponentItem")]
    public class HomePageComponentItem
    {
        [Key]
        public int Id { get; set; }

        public int ComponentId { get; set; }

        public string? Title { get; set; }

        public string? Subtitle { get; set; }

        public string? Description { get; set; }

        public string? RefId { get; set; }

        public string? RefType { get; set; }

        public int? DisplayOrder { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public bool IsDeleted { get; set; } = false;

        public int CreatedBy { get; set; } = 1;

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public int? LastModifiedBy { get; set; }

        public DateTime? LastModifiedDate { get; set; }

        [JsonIgnore]
        [ForeignKey("ComponentId")]
        public virtual HomePageComponent? Component { get; set; }
    }
}
