using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;
using Hiya2.Server.Services;

namespace Hiya2.Server.Controllers
{
    public class NewsletterSubscribeDto
    {
        public string Email { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class NewsletterController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IEmailService _emailService;

        public NewsletterController(DataContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        [HttpPost("subscribe")]
        [AllowAnonymous]
        public async Task<IActionResult> Subscribe([FromBody] NewsletterSubscribeDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.Email))
            {
                return BadRequest(new { isSuccess = false, message = "Please provide a valid email address." });
            }

            var cleanEmail = dto.Email.Trim().ToLowerInvariant();

            // Simple email validation regex
            if (!cleanEmail.Contains('@') || !cleanEmail.Contains('.'))
            {
                return BadRequest(new { isSuccess = false, message = "Please provide a valid email address format." });
            }

            try
            {
                var existing = await _context.NewsletterSubscribers
                    .FirstOrDefaultAsync(s => s.Email == cleanEmail);

                if (existing != null)
                {
                    if (!existing.IsActive)
                    {
                        existing.IsActive = true;
                        existing.SubscribedDate = DateTime.Now;
                        await _context.SaveChangesAsync();
                    }

                    // Already subscribed, send confirmation anyway
                    _ = SendWelcomeEmailAsync(cleanEmail);
                    return Ok(new { isSuccess = true, message = "You're already subscribed! A confirmation was sent to your inbox." });
                }

                var subscriber = new NewsletterSubscriber
                {
                    Email = cleanEmail,
                    IsActive = true,
                    SubscribedDate = DateTime.Now,
                    Source = "HOMEPAGE_RETENTION",
                    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
                };

                await _context.NewsletterSubscribers.AddAsync(subscriber);
                await _context.SaveChangesAsync();

                // Fire & forget welcome email
                _ = SendWelcomeEmailAsync(cleanEmail);

                return Ok(new { isSuccess = true, message = "Thank you for subscribing! Welcome email has been sent." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[NEWSLETTER ERROR] {ex.Message}");
                return StatusCode(500, new { isSuccess = false, message = "An error occurred while saving your subscription. Please try again." });
            }
        }

        private async Task SendWelcomeEmailAsync(string email)
        {
            try
            {
                var templateData = new Dictionary<string, string>
                {
                    { "subscriberEmail", email },
                    { "storeUrl", $"{Request.Scheme}://{Request.Host}" }
                };

                await _emailService.SendEmailAsync(
                    email,
                    "Welcome to the Hiya Ghar Family!",
                    "newsletter_welcome",
                    templateData
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[NEWSLETTER EMAIL SEND ERROR] {ex.Message}");
            }
        }

        [HttpGet("admin/subscribers")]
        [Authorize]
        public async Task<IActionResult> GetAllSubscribers()
        {
            var subscribers = await _context.NewsletterSubscribers
                .OrderByDescending(s => s.SubscribedDate)
                .Select(s => new
                {
                    s.Id,
                    s.Email,
                    s.IsActive,
                    s.SubscribedDate,
                    s.Source
                })
                .ToListAsync();

            return Ok(new { isSuccess = true, subscribers });
        }
    }
}
