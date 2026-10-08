using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    [Table("Attribute")]
    public class AttributeEntity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(150)]
        public string? DisplayName { get; set; }

        public bool? IsActive { get; set; } = true;

        public bool? IsDeleted { get; set; } = false;

        public int? CreatedBy { get; set; }

        public DateTime? CreatedDate { get; set; } = DateTime.Now;

        public int? LastModifiedBy { get; set; }

        public DateTime? LastModifiedDate { get; set; }

        public virtual ICollection<AttributeValue> AttributeValues { get; set; } = new List<AttributeValue>();
    }
}
