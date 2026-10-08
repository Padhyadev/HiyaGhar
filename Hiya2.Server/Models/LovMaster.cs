using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    // Generic "List of Values" lookup: groups of Code -> editable display text.
    // App code always stores/compares the stable LovCode (e.g. OrderStatus enum
    // names) - LovDesc is the only thing an admin can change, so renaming a
    // label never requires a code deployment.
    [Table("LovMaster")]
    public class LovMaster
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string LovColumn { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string LovCode { get; set; } = string.Empty;

        [Required, MaxLength(200)]
        public string LovDesc { get; set; } = string.Empty;

        public int DisplayOrder { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public bool IsDeleted { get; set; } = false;

        public long? CreatedBy { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public long? LastModifiedBy { get; set; }

        public DateTime? LastModifiedDate { get; set; }
    }
}
