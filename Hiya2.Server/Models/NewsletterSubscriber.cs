using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    [Table("NewsletterSubscriber")]
    public class NewsletterSubscriber
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string Email { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public DateTime SubscribedDate { get; set; } = DateTime.Now;

        [MaxLength(50)]
        public string Source { get; set; } = "HOMEPAGE_FOOTER";

        [MaxLength(50)]
        public string? IpAddress { get; set; }
    }
}
