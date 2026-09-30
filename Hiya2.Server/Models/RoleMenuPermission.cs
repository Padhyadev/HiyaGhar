using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    [Table("RoleMenuPermission")]
    public class RoleMenuPermission
    {
        [Key]
        public long PermissionId { get; set; }

        [ForeignKey("Role")]
        public int RoleId { get; set; }

        [ForeignKey("Menu")]
        public int MenuId { get; set; }

        public bool CanView { get; set; } = false;

        public bool CanAdd { get; set; } = false;

        public bool CanEdit { get; set; } = false;

        public bool CanDelete { get; set; } = false;

        public bool CanExport { get; set; } = false;

        public long? CreatedBy { get; set; }

        public DateTime? CreatedDate { get; set; } = DateTime.Now;

        public long? LastModifiedBy { get; set; }

        public DateTime? LastModifiedDate { get; set; }

        public virtual Role? Role { get; set; }
        public virtual Menu? Menu { get; set; }
    }
}
