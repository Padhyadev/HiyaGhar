using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    [Table("OrderStatusHistory")]
    public class OrderStatusHistory
    {
        [Key]
        public long Id { get; set; }

        public long OrderId { get; set; }

        public OrderStatus? OldStatus { get; set; }

        public OrderStatus NewStatus { get; set; }

        public string? Remarks { get; set; }

        public DateTime ChangedDate { get; set; } = DateTime.Now;

        public long? ChangedBy { get; set; }
    }
}
