using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    [Table("Menus")]
    public class Menu
    {
        [Key]
        [Column("MenuId")]
        public int MenuId { get; set; }

        public int ParentId { get; set; } = 0;

        [MaxLength(100)]
        public string? Controller { get; set; }

        [MaxLength(150)]
        public string? Name { get; set; }

        [MaxLength(150)]
        public string? Icon { get; set; }

        public int? DisplayOrder { get; set; } = 0;

        public bool? SuperAdmin { get; set; } = true;

        public bool? IsActive { get; set; } = true;

        public bool? IsDeleted { get; set; } = false;

        public int? CreatedBy { get; set; }

        public DateTime? CreatedDate { get; set; } = DateTime.Now;

        public int? LastModifiedBy { get; set; }

        public DateTime? LastModifiedDate { get; set; }

        public virtual ICollection<RoleMenuPermission> RoleMenuPermissions { get; set; } = new List<RoleMenuPermission>();
    }
}
