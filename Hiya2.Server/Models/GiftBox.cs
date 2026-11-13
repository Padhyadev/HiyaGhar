using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    /// <summary>
    /// A gift box size the store packs gifts in. Capacity is in "gift units": every product
    /// variant has a GiftUnits value (how much box space one piece takes), and the smallest
    /// box whose capacity fits the total is chosen automatically (see GiftBoxPlanner).
    /// Admin edits these in Store Settings → Gift Boxes.
    /// </summary>
    [Table("GiftBox")]
    public class GiftBox
    {
        [Key]
        public int Id { get; set; }

        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        /// <summary>How many gift units fit in one box of this size.</summary>
        public int Capacity { get; set; }

        public int DisplayOrder { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public bool IsDeleted { get; set; } = false;

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? LastModifiedDate { get; set; }
    }
}
