using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hiya2.Server.Models
{
    [Table("PasswordResetOtp")]
    public class PasswordResetOtp
    {
        [Key]
        public long Id { get; set; }

        public long CustomerId { get; set; }

        public string Email { get; set; } = string.Empty;

        [MaxLength(6)]
        public string OtpCode { get; set; } = string.Empty;

        public DateTime ExpiresAt { get; set; }

        public bool IsUsed { get; set; } = false;

        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
