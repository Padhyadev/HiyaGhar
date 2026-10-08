using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    [Table("StockSetting")]
    public class StockSetting
    {
        [Key]
        public int Id { get; set; }

        public int DefaultLowStockThreshold { get; set; } = 10;

        public int ReservationExpiryMinutes { get; set; } = 20;

        public bool IsActive { get; set; } = true;

        public long? LastModifiedBy { get; set; }

        public DateTime? LastModifiedDate { get; set; }
    }
}
