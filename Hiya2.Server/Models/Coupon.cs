using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    public enum CouponDiscountType
    {
        Percent,
        Flat
    }

    [Table("Coupon")]
    public class Coupon
    {
        [Key]
        public int Id { get; set; }

        public string Code { get; set; } = string.Empty;

        public string? Description { get; set; }

        public CouponDiscountType DiscountType { get; set; } = CouponDiscountType.Percent;

        public decimal DiscountValue { get; set; }

        public decimal? MaxDiscountAmount { get; set; }

        public decimal MinOrderAmount { get; set; } = 0;

        public DateTime StartDate { get; set; } = DateTime.Now;

        public DateTime EndDate { get; set; } = DateTime.Now.AddMonths(1);

        public int? MaxUsage { get; set; }

        public int? PerCustomerUsage { get; set; }

        public bool IsFirstOrderOnly { get; set; } = false;

        public bool IsActive { get; set; } = true;

        public bool IsDeleted { get; set; } = false;

        public int CreatedBy { get; set; } = 1;

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public int? LastModifiedBy { get; set; }

        public DateTime? LastModifiedDate { get; set; }
    }
}
