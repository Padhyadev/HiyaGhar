using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    [Table("CustomerAddress")]
    public class CustomerAddress
    {
        [Key]
        public long Id { get; set; }

        public long CustomerId { get; set; }

        public string? CustomerName { get; set; }

        public string AddressLine1 { get; set; } = string.Empty;

        public string? AddressLine2 { get; set; }

        public string City { get; set; } = string.Empty;

        public string State { get; set; } = string.Empty;

        public string PostalCode { get; set; } = string.Empty;

        public string Country { get; set; } = "India";

        public long? CountryId { get; set; }

        public long? StateId { get; set; }

        public string? AddressType { get; set; } = "SHIPPING";

        public string? MobileNo { get; set; }

        public string? AlternativeMobileNo { get; set; }

        public bool IsDefault { get; set; } = false;

        public bool IsActive { get; set; } = true;

        public bool IsDeleted { get; set; } = false;

        public long? CreatedBy { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        public long? LastModifiedBy { get; set; }

        public DateTime? LastModifiedDate { get; set; }
    }
}
