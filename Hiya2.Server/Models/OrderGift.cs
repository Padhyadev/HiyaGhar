using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Hiya2.Server.Models
{
    /// <summary>
    /// Gift packing details for an order (one row per gifted order; normal orders have none).
    /// The products themselves are the order's OrderItems. File paths are relative to the
    /// private gift storage folder (GiftStorage) - never under wwwroot.
    /// </summary>
    [Table("OrderGift")]
    public class OrderGift
    {
        [Key]
        public long Id { get; set; }

        public long OrderId { get; set; }

        /// <summary>"Normal" or "Personalised" (see GiftTypes).</summary>
        [MaxLength(20)]
        public string GiftType { get; set; } = string.Empty;

        public int BoxCount { get; set; }

        /// <summary>Readable box list, e.g. "1 × Medium Box, 1 × Small Box".</summary>
        [MaxLength(300)]
        public string BoxSummary { get; set; } = string.Empty;

        /// <summary>The planned boxes as JSON (name, capacity, units used) - a snapshot so later box edits don't change old orders.</summary>
        public string? BoxesJson { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ChargePerBox { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalCharge { get; set; }

        [MaxLength(300)]
        public string? PhotoOriginalPath { get; set; }

        [MaxLength(300)]
        public string? PhotoPath { get; set; }

        /// <summary>The message as sanitised editor JSON (per-word font, size, colour, styles, paragraph alignment).</summary>
        public string? MessageJson { get; set; }

        /// <summary>Plain-text copy of the message for search and quick reading.</summary>
        [MaxLength(2000)]
        public string? MessageText { get; set; }

        [MaxLength(300)]
        public string? InsertPdfPath { get; set; }

        public bool IsForSelf { get; set; } = true;

        [MaxLength(150)]
        public string? RecipientName { get; set; }

        [MaxLength(20)]
        public string? RecipientPhone { get; set; }

        public DateTime CreatedDate { get; set; } = DateTime.Now;

        [JsonIgnore]
        [ForeignKey("OrderId")]
        public virtual Order? Order { get; set; }
    }

    public static class GiftTypes
    {
        public const string None = "None";
        public const string Normal = "Normal";
        public const string Personalised = "Personalised";
    }
}
