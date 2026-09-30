using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Hiya2.Server.Models
{
    [Table("CouponUsage")]
    public class CouponUsage
    {
        [Key]
        public long Id { get; set; }

        public int CouponId { get; set; }

        public long CustomerId { get; set; }

        public long OrderId { get; set; }

        public decimal DiscountAmount { get; set; }

        public DateTime UsedDate { get; set; } = DateTime.Now;

        [JsonIgnore]
        [ForeignKey("CouponId")]
        public virtual Coupon? Coupon { get; set; }
    }
}
