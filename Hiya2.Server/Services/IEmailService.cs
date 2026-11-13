namespace Hiya2.Server.Services
{
    /// <summary>A file to attach to an email (read from disk when the email is sent).</summary>
    public record EmailAttachment(string FileName, string FilePath, string ContentType);

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
            Dictionary<string, string> templateData,
            IEnumerable<EmailAttachment>? attachments = null);

        /// <summary>
        /// Comma-separated admin recipient list: the account email that sends
        /// mail (Email:FromEmail) plus the separately configurable
        /// Email:AdminNotificationEmail. Driven entirely by config, so the
        /// admin address(es) can be changed later without a code change.
        /// </summary>
        string GetAdminNotificationRecipients();
    }
}
