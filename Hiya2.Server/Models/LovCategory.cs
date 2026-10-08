using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    // The category ("LovColumn") itself, as a real record - separate from
    // LovMaster's code rows. LovColumn is the stable key app code refers to
    // (immutable once created); DisplayText is the only thing an admin can
    // rename from the LOV admin screen.
    [Table("LovCategory")]
    public class LovCategory
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string LovColumn { get; set; } = string.Empty;

        [Required, MaxLength(200)]
        public string DisplayText { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public bool IsDeleted { get; set; } = false;

        public long? CreatedBy { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public long? LastModifiedBy { get; set; }

        public DateTime? LastModifiedDate { get; set; }
    }
}
