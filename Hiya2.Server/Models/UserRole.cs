using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    [Table("UserRole")]
    public class UserRole
    {
        [Key]
        public long Id { get; set; }

        [ForeignKey("User")]
        public long UserId { get; set; }

        [ForeignKey("Role")]
        public int RoleId { get; set; }

        public DateTime AssignedDate { get; set; } = DateTime.Now;

        public long? AssignedBy { get; set; }

        public virtual User? User { get; set; }
        public virtual Role? Role { get; set; }
    }
}
