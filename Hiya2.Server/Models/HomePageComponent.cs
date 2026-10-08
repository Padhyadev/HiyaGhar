using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    [Table("HomePageComponent")]
    public class HomePageComponent
    {
        [Key]
        public int Id { get; set; }

        public string Key { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public int DisplayOrder { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public bool IsDeleted { get; set; } = false;

        public int CreatedBy { get; set; } = 1;

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public int? LastModifiedBy { get; set; }

        public DateTime? LastModifiedDate { get; set; }

        public virtual ICollection<HomePageComponentItem> Items { get; set; } = new List<HomePageComponentItem>();
    }
}
