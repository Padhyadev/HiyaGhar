using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    [Table("AttributeValue")]
    public class AttributeValue
    {
        [Key]
        public int Id { get; set; }

        [ForeignKey("Attribute")]
        public int AttributeId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Value { get; set; } = string.Empty;

        public bool? IsActive { get; set; } = true;

        public bool? IsDeleted { get; set; } = false;

        public int? CreatedBy { get; set; }

        public DateTime? CreatedDate { get; set; } = DateTime.Now;

        public int? LastModifiedBy { get; set; }

        public DateTime? LastModifiedDate { get; set; }

        public virtual AttributeEntity? Attribute { get; set; }
    }
}
