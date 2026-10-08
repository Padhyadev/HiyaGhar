using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    [Table("RewardSetting")]
    public class RewardSetting
    {
        [Key]
        public int Id { get; set; }

        public int SignupCoins { get; set; } = 0;

        public int LoginCoins { get; set; } = 0;

        public int ReferralCoins { get; set; } = 0;

        public int ReferralJoinCoins { get; set; } = 0;

        public decimal CoinToRupeeRate { get; set; } = 1;

        public decimal MaxCoinUsagePercent { get; set; } = 10;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public DateTime? LastModifiedDate { get; set; }
    }
}
