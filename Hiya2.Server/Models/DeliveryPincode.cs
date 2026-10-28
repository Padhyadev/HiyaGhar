using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    // Fixed master list of Ahmedabad district pincodes (seeded at startup from
    // Infra/DeliveryPincodeSeed.cs). Admins can only switch IsAllowed on/off; rows are never
    // added or edited, so orders can only ever go to an Ahmedabad pincode.
    [Table("DeliveryPincode")]
    public class DeliveryPincode
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(6)]
        public string Pincode { get; set; } = string.Empty;

        [MaxLength(200)]
        public string AreaName { get; set; } = string.Empty;

        public bool IsAllowed { get; set; } = false;

        public long? LastModifiedBy { get; set; }
        public DateTime? LastModifiedDate { get; set; }
    }
}
 