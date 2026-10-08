using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    public enum RewardTransactionType
    {
        Earned,
        Spent,
        Refunded,
        AdminGrant,
        EarnReversed
    }

    [Table("RewardTransaction")]
    public class RewardTransaction
    {
        [Key]
        public long Id { get; set; }

        public long CustomerId { get; set; }

        public long? OrderId { get; set; }

        public RewardTransactionType Type { get; set; }

        public int Coins { get; set; }

        public string? Source { get; set; }

        public string? Remarks { get; set; }

        public int BalanceAfter { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
