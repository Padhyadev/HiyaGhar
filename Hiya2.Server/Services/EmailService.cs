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

            var rawList = $"{fromEmail},{adminEmail}"
                .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            return string.Join(",", rawList.Distinct(StringComparer.OrdinalIgnoreCase));
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
                var webRoot = !string.IsNullOrEmpty(_environment.WebRootPath)
                    ? _environment.WebRootPath
                    : Path.Combine(_environment.ContentRootPath, "wwwroot");

                var templatePath = Path.Combine(webRoot, "EmailTemplates", $"{templateFile}.html");
                if (!File.Exists(templatePath))
                {
                    Console.WriteLine($"[EMAIL ERROR] Template file not found: {templatePath}");
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
                var displayName = EmailConfig.GetValue<string>("DisplayName") ?? "HIYAGHAR";
                var host = EmailConfig.GetValue<string>("Host") ?? "smtp.gmail.com";
                var port = EmailConfig.GetValue<int?>("Port") ?? 587;
                var enableSsl = EmailConfig.GetValue<bool?>("EnableSsl") ?? true;
                var password = (EmailConfig.GetValue<string>("Password") ?? string.Empty).Replace(" ", "");

                Console.WriteLine($"[EMAIL ATTEMPT] Sending '{subject}' from '{fromEmail}' to '{toEmail}' via {host}:{port}...");

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(fromEmail, displayName),
                    Subject = subject,
                    IsBodyHtml = true
                };

                foreach (var recipient in toEmail.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                {
                    mailMessage.To.Add(recipient);
                }

                var logoPath = Path.Combine(webRoot, "EmailTemplates", "logo.png");
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
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    Timeout = 15000
                };

                await smtpClient.SendMailAsync(mailMessage);
                Console.WriteLine($"[EMAIL SUCCESS] Sent '{subject}' to '{toEmail}' successfully.");
                return (true, "Email sent successfully.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EMAIL EXCEPTION] Failed sending '{subject}' to '{toEmail}': {ex}");
                return (false, $"Failed to send email: {ex.Message}");
            }
        }
    }
}
