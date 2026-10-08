namespace Hiya2.Server.Services
{
    public interface IEmailService
    {
        /// <summary>
        /// Sends an HTML email built from a template file in wwwroot/EmailTemplates.
        /// toEmail may contain multiple comma-separated addresses. Never throws -
        /// failures (including the master IsSendMail switch being off) are reported
        /// via the returned result so callers (checkout, status updates, OTP) never
        /// fail a business operation because of a broken/disabled mail setup.
        /// </summary>
        Task<(bool IsSuccess, string Message)> SendEmailAsync(
            string toEmail,
            string subject,
            string templateFile,
            Dictionary<string, string> templateData);

        /// <summary>
        /// Comma-separated admin recipient list: the account email that sends
        /// mail (Email:FromEmail) plus the separately configurable
        /// Email:AdminNotificationEmail. Driven entirely by config, so the
        /// admin address(es) can be changed later without a code change.
        /// </summary>
        string GetAdminNotificationRecipients();
    }
}
