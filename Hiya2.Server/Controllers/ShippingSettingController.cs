using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;
using Hiya2.Server.Authorization;
using Hiya2.Server.Services;

namespace Hiya2.Server.Controllers
{
    public class SendTestEmailDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class ShippingSettingRequestDto
    {
        public decimal FreeShippingThreshold { get; set; }
        public decimal StandardShippingPrice { get; set; }
        public decimal ExpressShippingPrice { get; set; }
        public bool EnableExpressDelivery { get; set; }
        public bool EnableFreeShipping { get; set; }
        public bool OnlyAhmedabadDelivery { get; set; }
        public string StandardDeliveryDays { get; set; } = "3–5 business days";
        public string ExpressDeliveryDays { get; set; } = "1–2 business days";
        public bool EnableGstDisplay { get; set; }
        public decimal GstPercent { get; set; }
        public string GstLabel { get; set; } = "Estimated GST (5% Included)";
        // Store & Footer details
        public string? FssaiLicenseNumber { get; set; }
        public bool EnableFssaiDisplay { get; set; } = false;
        public string? ContactEmail { get; set; }
        public string? ContactPhone { get; set; }
        public string? ContactAddress { get; set; }
        // Global Product Detail Tabs Visibility
        public bool EnableProductDescriptionTab { get; set; } = true;
        public bool EnableProductIngredientsTab { get; set; } = true;
        public bool EnableProductNutritionTab { get; set; } = true;
        public bool EnableProductReviewsTab { get; set; } = true;
        // Admin Order Notification Recipients
        public string? AdminNotificationEmails { get; set; }
        public bool EnableAdminOrderAlerts { get; set; } = true;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ShippingSettingController : ControllerBase
    {
        private readonly DataContext _context;

        public ShippingSettingController(DataContext context)
        {
            _context = context;
        }

        private long GetCurrentUserId()
        {
            var claimSub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return long.TryParse(claimSub, out var id) ? id : 0;
        }

        private async Task<ShippingSetting> GetOrCreateAsync()
        {
            var setting = await _context.ShippingSettings.FirstOrDefaultAsync(s => s.IsActive);
            if (setting == null)
            {
                setting = new ShippingSetting();
                await _context.ShippingSettings.AddAsync(setting);
                await _context.SaveChangesAsync();
            }
            return setting;
        }

        // PUBLIC endpoint — no auth needed; customers can read shipping config
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Get()
        {
            var s = await GetOrCreateAsync();
            return Ok(new
            {
                isSuccess = true,
                settings = new
                {
                    freeShippingThreshold = s.FreeShippingThreshold,
                    standardShippingPrice = s.StandardShippingPrice,
                    expressShippingPrice = s.ExpressShippingPrice,
                    enableExpressDelivery = s.EnableExpressDelivery,
                    enableFreeShipping = s.EnableFreeShipping,
                    onlyAhmedabadDelivery = s.OnlyAhmedabadDelivery,
                    standardDeliveryDays = s.StandardDeliveryDays,
                    expressDeliveryDays = s.ExpressDeliveryDays,
                    enableGstDisplay = s.EnableGstDisplay,
                    gstPercent = s.GstPercent,
                    gstLabel = s.GstLabel,
                    fssaiLicenseNumber = s.FssaiLicenseNumber,
                    enableFssaiDisplay = s.EnableFssaiDisplay,
                    contactEmail = s.ContactEmail,
                    contactPhone = s.ContactPhone,
                    contactAddress = s.ContactAddress,
                    enableProductDescriptionTab = s.EnableProductDescriptionTab,
                    enableProductIngredientsTab = s.EnableProductIngredientsTab,
                    enableProductNutritionTab = s.EnableProductNutritionTab,
                    enableProductReviewsTab = s.EnableProductReviewsTab,
                    adminNotificationEmails = s.AdminNotificationEmails ?? "vmgami333@gmail.com,pranav@yopmail.com,pranav0612@yopmail.com",
                    enableAdminOrderAlerts = s.EnableAdminOrderAlerts
                }
            });
        }

        // ADMIN only — save settings to DB
        [HttpPut]
        [Authorize(Policy = AuthPolicies.Staff)]
        public async Task<IActionResult> Update([FromBody] ShippingSettingRequestDto dto)
        {
            if (dto.StandardShippingPrice < 0 || dto.ExpressShippingPrice < 0 || dto.FreeShippingThreshold < 0)
                return BadRequest(new { isSuccess = false, message = "Shipping charges cannot be negative." });

            var setting = await GetOrCreateAsync();

            setting.FreeShippingThreshold = dto.FreeShippingThreshold;
            setting.StandardShippingPrice = dto.StandardShippingPrice;
            setting.ExpressShippingPrice = dto.ExpressShippingPrice;
            setting.EnableExpressDelivery = dto.EnableExpressDelivery;
            setting.EnableFreeShipping = dto.EnableFreeShipping;
            setting.OnlyAhmedabadDelivery = dto.OnlyAhmedabadDelivery;
            setting.StandardDeliveryDays = dto.StandardDeliveryDays ?? "3–5 business days";
            setting.ExpressDeliveryDays = dto.ExpressDeliveryDays ?? "1–2 business days";
            setting.EnableGstDisplay = dto.EnableGstDisplay;
            setting.GstPercent = dto.GstPercent;
            setting.GstLabel = dto.GstLabel ?? "Estimated GST (5% Included)";
            setting.FssaiLicenseNumber = dto.FssaiLicenseNumber ?? "";
            setting.EnableFssaiDisplay = dto.EnableFssaiDisplay;
            setting.ContactEmail = dto.ContactEmail ?? "hiyaghar@gmail.com";
            setting.ContactPhone = dto.ContactPhone ?? "+91 92744 43617";
            setting.ContactAddress = dto.ContactAddress ?? "303, APM Mall Complex, Near Bharat Petrol Pump, Sattadhar Cross Road, Ghatlodiya Ahmedabad 380061, Gujarat, India";
            setting.EnableProductDescriptionTab = dto.EnableProductDescriptionTab;
            setting.EnableProductIngredientsTab = dto.EnableProductIngredientsTab;
            setting.EnableProductNutritionTab = dto.EnableProductNutritionTab;
            setting.EnableProductReviewsTab = dto.EnableProductReviewsTab;

            if (dto.AdminNotificationEmails != null)
            {
                setting.AdminNotificationEmails = dto.AdminNotificationEmails.Trim();
            }
            setting.EnableAdminOrderAlerts = dto.EnableAdminOrderAlerts;

            setting.LastModifiedBy = GetCurrentUserId();
            setting.LastModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(new { isSuccess = true, message = "Store settings saved to database." });
        }

        // ADMIN only — send a test notification email to a specific recipient
        [HttpPost("test-email")]
        [Authorize(Policy = AuthPolicies.Staff)]
        public async Task<IActionResult> SendTestEmail([FromBody] SendTestEmailDto dto, [FromServices] IEmailService emailService)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { isSuccess = false, message = "Please provide an email address." });
            }

            var cleanEmail = dto.Email.Trim();
            if (!Regex.IsMatch(cleanEmail, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            {
                return BadRequest(new { isSuccess = false, message = "Invalid email address format." });
            }

            var istNow = DateTime.UtcNow.AddHours(5.5).ToString("dd MMM yyyy, hh:mm tt") + " IST";
            var triggeredBy = User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? "HIYAGHAR Admin Portal";

            var templateData = new Dictionary<string, string>
            {
                { "targetEmail", cleanEmail },
                { "sentAt", istNow },
                { "triggeredBy", triggeredBy },
                { "companyName", "HIYAGHAR" }
            };

            var (isSuccess, message) = await emailService.SendEmailAsync(
                cleanEmail,
                "HIYAGHAR - Notification System Test",
                "admin_test_email",
                templateData
            );

            if (!isSuccess)
            {
                return StatusCode(500, new { isSuccess = false, message = $"Failed to send test email: {message}" });
            }

            return Ok(new { isSuccess = true, message = $"Test email sent successfully to {cleanEmail}." });
        }
    }
}
