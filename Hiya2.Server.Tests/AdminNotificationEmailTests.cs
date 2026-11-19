using System.Text.RegularExpressions;
using Xunit;

namespace Hiya2.Server.Tests
{
    public class AdminNotificationEmailTests
    {
        [Fact]
        public void AdminTestEmailTemplate_ExistsAndContainsRequiredTokens()
        {
            var basePath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "Hiya2.Server", "wwwroot", "EmailTemplates", "admin_test_email.html"));
            Assert.True(File.Exists(basePath), $"Template not found at {basePath}");

            var content = File.ReadAllText(basePath);
            Assert.Contains("{{targetEmail}}", content);
            Assert.Contains("{{sentAt}}", content);
            Assert.Contains("{{triggeredBy}}", content);
            Assert.Contains("HIYAGHAR ADMIN", content);
        }

        [Theory]
        [InlineData("vmgami333@gmail.com", true)]
        [InlineData("pranav@yopmail.com", true)]
        [InlineData("pranav0612@yopmail.com", true)]
        [InlineData("test.user+tag@domain.co.in", true)]
        [InlineData("invalid-email", false)]
        [InlineData("user@", false)]
        [InlineData("@domain.com", false)]
        [InlineData("user@domain", false)]
        [InlineData("", false)]
        public void EmailValidationRegex_CorrectlyValidatesAddresses(string email, bool expectedValid)
        {
            var isValid = !string.IsNullOrWhiteSpace(email) && Regex.IsMatch(email.Trim(), @"^[^@\s]+@[^@\s]+\.[^@\s]+$");
            Assert.Equal(expectedValid, isValid);
        }

        [Fact]
        public void CommaSeparatedEmailParsing_CorrectlyExtractsDistinctEmails()
        {
            var raw = "vmgami333@gmail.com, pranav@yopmail.com; pranav0612@yopmail.com, VMGAMI333@GMAIL.COM";
            var parsed = raw
                .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            Assert.Equal(3, parsed.Count);
            Assert.Contains("vmgami333@gmail.com", parsed);
            Assert.Contains("pranav@yopmail.com", parsed);
            Assert.Contains("pranav0612@yopmail.com", parsed);
        }
    }
}
