using System.Net;
using System.Net.Mail;
using System.Net.Mime;
using System.Text.RegularExpressions;

namespace Hiya2.Server.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;

        public EmailService(IConfiguration configuration, IWebHostEnvironment environment)
        {
            _configuration = configuration;
            _environment = environment;
        }

        private IConfigurationSection EmailConfig => _configuration.GetSection("Email");

        public string GetAdminNotificationRecipients()
        {
            var fromEmail = EmailConfig.GetValue<string>("FromEmail") ?? string.Empty;
            var adminEmail = EmailConfig.GetValue<string>("AdminNotificationEmail") ?? string.Empty;

            return string.Join(",", new[] { fromEmail, adminEmail }
                .Where(e => !string.IsNullOrWhiteSpace(e))
                .Distinct(StringComparer.OrdinalIgnoreCase));
        }

        public async Task<(bool IsSuccess, string Message)> SendEmailAsync(
            string toEmail,
            string subject,
            string templateFile,
            Dictionary<string, string> templateData)
        {
            if (string.IsNullOrWhiteSpace(toEmail))
            {
                return (false, "No recipient email address supplied.");
            }

            var isSendMail = EmailConfig.GetValue<bool>("IsSendMail");
            if (!isSendMail)
            {
                return (false, "Sending Mail service is stop.");
            }

            try
            {
                var templatePath = Path.Combine(_environment.WebRootPath, "EmailTemplates", $"{templateFile}.html");
                if (!File.Exists(templatePath))
                {
                    return (false, $"Email template '{templateFile}.html' was not found.");
                }

                var body = await File.ReadAllTextAsync(templatePath);
                foreach (var kvp in templateData)
                {
                    body = body.Replace($"{{{{{kvp.Key}}}}}", kvp.Value ?? string.Empty);
                }
                // Strip any leftover unfilled tokens so nothing like "{{foo}}" ever
                // leaks into a real customer's inbox.
                body = Regex.Replace(body, "{{.*?}}", string.Empty);

                var fromEmail = EmailConfig.GetValue<string>("FromEmail") ?? string.Empty;
                var displayName = EmailConfig.GetValue<string>("DisplayName") ?? "Hiya";
                var host = EmailConfig.GetValue<string>("Host") ?? "smtp.gmail.com";
                var port = EmailConfig.GetValue<int?>("Port") ?? 587;
                var enableSsl = EmailConfig.GetValue<bool?>("EnableSsl") ?? true;
                var password = EmailConfig.GetValue<string>("Password") ?? string.Empty;

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(fromEmail, displayName),
                    Subject = subject,
                    IsBodyHtml = true
                };

                foreach (var recipient in toEmail.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                {
                    mailMessage.To.Add(recipient);
                }

                var logoPath = Path.Combine(_environment.WebRootPath, "EmailTemplates", "logo.png");
                if (File.Exists(logoPath))
                {
                    var alternateView = AlternateView.CreateAlternateViewFromString(body, null, "text/html");
                    var logoResource = new LinkedResource(logoPath, "image/png")
                    {
                        ContentId = "CompanyLogo",
                        TransferEncoding = TransferEncoding.Base64
                    };
                    alternateView.LinkedResources.Add(logoResource);
                    mailMessage.AlternateViews.Add(alternateView);
                }
                else
                {
                    mailMessage.Body = body;
                }

                using var smtpClient = new SmtpClient(host, port)
                {
                    EnableSsl = enableSsl,
                    Credentials = new NetworkCredential(fromEmail, password),
                    DeliveryMethod = SmtpDeliveryMethod.Network
                };

                await smtpClient.SendMailAsync(mailMessage);
                return (true, "Email sent successfully.");
            }
            catch (Exception ex)
            {
                return (false, $"Failed to send email: {ex.Message}");
            }
        }
    }
}
