using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    [Table("OrderRewardSlab")]
    public class OrderRewardSlab
    {
        [Key]
        public int Id { get; set; }

        public decimal MinOrderAmount { get; set; }

        public decimal MaxOrderAmount { get; set; }

        public int RewardCoins { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? LastModifiedDate { get; set; }
    }
}
