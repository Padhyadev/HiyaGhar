using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    [Table("ShippingSetting")]
    public class ShippingSetting
    {
        [Key]
        public int Id { get; set; }

        // Delivery Charges & Thresholds
        [Column(TypeName = "decimal(18,2)")]
        public decimal FreeShippingThreshold { get; set; } = 500;

        [Column(TypeName = "decimal(18,2)")]
        public decimal StandardShippingPrice { get; set; } = 49;

        [Column(TypeName = "decimal(18,2)")]
        public decimal ExpressShippingPrice { get; set; } = 99;

        public bool EnableExpressDelivery { get; set; } = true;
        public bool EnableFreeShipping { get; set; } = true;

        // Delivery Zone
        public bool OnlyAhmedabadDelivery { get; set; } = true;

        // Delivery Duration Labels
        [MaxLength(100)]
        public string StandardDeliveryDays { get; set; } = "3–5 business days";

        [MaxLength(100)]
        public string ExpressDeliveryDays { get; set; } = "1–2 business days";

        // GST / Tax Settings
        public bool EnableGstDisplay { get; set; } = true;

        [Column(TypeName = "decimal(5,2)")]
        public decimal GstPercent { get; set; } = 5;

        [MaxLength(100)]
        public string GstLabel { get; set; } = "Estimated GST (5% Included)";

        // Footer & Store Trust Details (Manageable by Admin)
        [MaxLength(50)]
        public string FssaiLicenseNumber { get; set; } = "10723026001148";

        public bool EnableFssaiDisplay { get; set; } = true;

        [MaxLength(150)]
        public string ContactEmail { get; set; } = "support@hiyaghar.com";

        [MaxLength(50)]
        public string ContactPhone { get; set; } = "+91 92744 43617";

        [MaxLength(200)]
        public string ContactAddress { get; set; } = "Ahmedabad, Gujarat, India";

        public bool IsActive { get; set; } = true;
        public long? LastModifiedBy { get; set; }
        public DateTime? LastModifiedDate { get; set; }
    }
}
