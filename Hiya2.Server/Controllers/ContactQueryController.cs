using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;
using Hiya2.Server.Services;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace Hiya2.Server.Controllers
{
    public class ContactQueryDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string Subject { get; set; } = "General Inquiry";
        public string Message { get; set; } = string.Empty;
    }

    public class UpdateContactQueryStatusDto
    {
        public string Status { get; set; } = "Pending";
        public string? AdminNotes { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ContactQueryController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public ContactQueryController(DataContext context, IEmailService emailService, IConfiguration configuration)
        {
            _context = context;
            _emailService = emailService;
            _configuration = configuration;
        }

        // POST: api/ContactQuery/submit (Public with Strict Server-Side Validation)
        [HttpPost("submit")]
        [AllowAnonymous]
        public async Task<IActionResult> Submit([FromBody] ContactQueryDto dto)
        {
            var errors = new Dictionary<string, string>();

            // 1. Full Name Validation
            if (string.IsNullOrWhiteSpace(dto?.FullName))
            {
                errors["fullName"] = "Please enter your full name.";
            }
            else if (dto.FullName.Trim().Length < 2)
            {
                errors["fullName"] = "Please enter at least 2 characters for your full name.";
            }
            else if (dto.FullName.Trim().Length > 100)
            {
                errors["fullName"] = "Please enter a full name under 100 characters.";
            }

            // 2. Email Validation
            if (string.IsNullOrWhiteSpace(dto?.Email))
            {
                errors["email"] = "Please enter your email address.";
            }
            else
            {
                var cleanEmail = dto.Email.Trim().ToLowerInvariant();
                var emailRegex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.IgnoreCase);
                if (!emailRegex.IsMatch(cleanEmail))
                {
                    errors["email"] = "Please enter a valid email address (e.g. name@domain.com).";
                }
            }

            // 3. Optional Phone Validation
            if (!string.IsNullOrWhiteSpace(dto?.Phone))
            {
                var cleanPhone = Regex.Replace(dto.Phone.Trim(), @"[^\d+]", "");
                if (cleanPhone.Length < 10 || cleanPhone.Length > 15)
                {
                    errors["phone"] = "Please enter a valid 10-digit phone or WhatsApp number.";
                }
            }

            // 4. Message Validation
            if (string.IsNullOrWhiteSpace(dto?.Message))
            {
                errors["message"] = "Please enter your message or query.";
            }
            else if (dto.Message.Trim().Length < 5)
            {
                errors["message"] = "Please enter at least 5 characters in your message.";
            }
            else if (dto.Message.Trim().Length > 2000)
            {
                errors["message"] = "Please keep your message under 2000 characters.";
            }

            // If any server-side validation fails, return 400 Bad Request with field errors
            if (errors.Count > 0)
            {
                var firstError = errors.Values.FirstOrDefault() ?? "Please check all required fields.";
                return BadRequest(new
                {
                    isSuccess = false,
                    message = firstError,
                    errors = errors
                });
            }

            try
            {
                var query = new ContactQuery
                {
                    FullName = dto!.FullName.Trim(),
                    Email = dto.Email.Trim().ToLowerInvariant(),
                    Phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim(),
                    Subject = string.IsNullOrWhiteSpace(dto.Subject) ? "General Inquiry" : dto.Subject.Trim(),
                    Message = dto.Message.Trim(),
                    Status = "Pending",
                    IsActive = true,
                    IsDeleted = false,
                    CreatedDate = DateTime.Now
                };

                await _context.ContactQueries.AddAsync(query);
                await _context.SaveChangesAsync();

                // Fire Email Notifications to Customer & Admin in background task (Non-blocking)
                _ = Task.Run(async () =>
                {
                    try
                    {
                        var submittedAt = query.CreatedDate.ToString("dd MMM yyyy, hh:mm tt");
                        var frontendUrl = _configuration.GetValue<string>("AppSettings:FrontendUrl") ?? "https://localhost:59979";
                        var adminPortalUrl = $"{frontendUrl.TrimEnd('/')}/admin/contact-queries";

                        // 1. Send Confirmation Email to Customer
                        var customerData = new Dictionary<string, string>
                        {
                            { "customerName", query.FullName },
                            { "queryId", query.Id.ToString() },
                            { "subject", query.Subject },
                            { "message", query.Message },
                            { "currentYear", DateTime.Now.Year.ToString() }
                        };

                        await _emailService.SendEmailAsync(
                            query.Email,
                            "We have received your message - HIYAGHAR",
                            "contact_inquiry_customer",
                            customerData
                        );

                        // 2. Send Notification Email to Admin(s)
                        var adminRecipients = _emailService.GetAdminNotificationRecipients();
                        if (!string.IsNullOrWhiteSpace(adminRecipients))
                        {
                            var adminData = new Dictionary<string, string>
                            {
                                { "customerName", query.FullName },
                                { "customerEmail", query.Email },
                                { "customerPhone", string.IsNullOrWhiteSpace(query.Phone) ? "Not Provided" : query.Phone },
                                { "queryId", query.Id.ToString() },
                                { "subject", query.Subject },
                                { "message", query.Message },
                                { "submittedDate", submittedAt },
                                { "adminPortalUrl", adminPortalUrl }
                            };

                            var adminList = adminRecipients.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries);
                            foreach (var adminEmail in adminList)
                            {
                                await _emailService.SendEmailAsync(
                                    adminEmail.Trim(),
                                    $"New Customer Inquiry: {query.Subject} (#{query.Id})",
                                    "contact_inquiry_admin",
                                    adminData
                                );
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[CONTACT QUERY EMAIL ERROR] {ex.Message}");
                    }
                });

                return Ok(new
                {
                    isSuccess = true,
                    message = "Thank you! Your inquiry has been received. Our team will contact you shortly.",
                    queryId = query.Id
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CONTACT QUERY SUBMIT ERROR] {ex.Message}");
                return StatusCode(500, new { isSuccess = false, message = "Failed to submit inquiry. Please try again later." });
            }
        }

        // GET: api/ContactQuery/admin/all (Admin)
        [HttpGet("admin/all")]
        [Authorize]
        public async Task<IActionResult> GetAllAdmin([FromQuery] string? status = null, [FromQuery] string? search = null)
        {
            try
            {
                var q = _context.ContactQueries
                    .Where(x => !x.IsDeleted)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(status) && status.ToLowerInvariant() != "all")
                {
                    q = q.Where(x => x.Status == status);
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var term = search.Trim().ToLowerInvariant();
                    q = q.Where(x =>
                        x.FullName.ToLower().Contains(term) ||
                        x.Email.ToLower().Contains(term) ||
                        (x.Phone != null && x.Phone.Contains(term)) ||
                        x.Subject.ToLower().Contains(term) ||
                        x.Message.ToLower().Contains(term)
                    );
                }

                var items = await q
                    .OrderByDescending(x => x.CreatedDate)
                    .Select(x => new
                    {
                        x.Id,
                        x.FullName,
                        x.Email,
                        x.Phone,
                        x.Subject,
                        x.Message,
                        x.Status,
                        x.AdminNotes,
                        x.CreatedDate,
                        x.ResolvedDate
                    })
                    .ToListAsync();

                return Ok(new
                {
                    isSuccess = true,
                    data = items,
                    total = items.Count
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CONTACT QUERY GET ERROR] {ex.Message}");
                return StatusCode(500, new { isSuccess = false, message = "Failed to fetch queries." });
            }
        }

        // PUT: api/ContactQuery/admin/{id}/status (Admin)
        [HttpPut("admin/{id}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateContactQueryStatusDto dto)
        {
            try
            {
                var query = await _context.ContactQueries.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
                if (query == null)
                {
                    return NotFound(new { isSuccess = false, message = "Inquiry not found." });
                }

                query.Status = string.IsNullOrWhiteSpace(dto.Status) ? query.Status : dto.Status.Trim();
                if (dto.AdminNotes != null)
                {
                    query.AdminNotes = dto.AdminNotes.Trim();
                }

                if (query.Status.Equals("Resolved", StringComparison.OrdinalIgnoreCase) ||
                    query.Status.Equals("Closed", StringComparison.OrdinalIgnoreCase))
                {
                    query.ResolvedDate = DateTime.Now;
                    
                    var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (long.TryParse(userIdClaim, out var parsedId))
                    {
                        query.ResolvedBy = parsedId;
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    isSuccess = true,
                    message = "Inquiry updated successfully.",
                    data = new
                    {
                        query.Id,
                        query.Status,
                        query.AdminNotes,
                        query.ResolvedDate
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CONTACT QUERY UPDATE ERROR] {ex.Message}");
                return StatusCode(500, new { isSuccess = false, message = "Failed to update inquiry." });
            }
        }

        // DELETE: api/ContactQuery/admin/{id} (Admin)
        [HttpDelete("admin/{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(long id)
        {
            try
            {
                var query = await _context.ContactQueries.FirstOrDefaultAsync(x => x.Id == id);
                if (query == null)
                {
                    return NotFound(new { isSuccess = false, message = "Inquiry not found." });
                }

                query.IsDeleted = true;
                await _context.SaveChangesAsync();

                return Ok(new { isSuccess = true, message = "Inquiry deleted successfully." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CONTACT QUERY DELETE ERROR] {ex.Message}");
                return StatusCode(500, new { isSuccess = false, message = "Failed to delete inquiry." });
            }
        }
    }
}
