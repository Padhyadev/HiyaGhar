using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Hiya2.Server.Models;

namespace Hiya2.Server.Services
{
    public class CustomerAuthService : ICustomerAuthService
    {
        private readonly IConfiguration _configuration;

        public CustomerAuthService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateCustomerToken(Customer customer)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var secretKey = jwtSettings["SecretKey"] ?? "HIYAGHAR_SUPER_SECRET_SECURITY_KEY_2026_PRODUCTION_GRADE_SECRET_KEY!";
            var issuer = jwtSettings["Issuer"] ?? "HIYAGHAR.Server";
            var audience = jwtSettings["Audience"] ?? "HIYAGHAR.Client";
            var expiryHours = double.TryParse(jwtSettings["ExpiryInHours"], out var h) ? h : 720; // 30 days default for shoppers

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, customer.CustomerId.ToString()),
                new Claim("CustomerId", customer.CustomerId.ToString()),
                new Claim(ClaimTypes.NameIdentifier, customer.CustomerId.ToString()),
                new Claim(ClaimTypes.Email, customer.Email ?? string.Empty),
                new Claim(ClaimTypes.Name, $"{customer.FirstName} {customer.LastName}".Trim()),
                new Claim(ClaimTypes.Role, "CUSTOMER"),
                new Claim("token_type", "customer")
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(expiryHours),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string HashPassword(string password)
        {
            if (string.IsNullOrEmpty(password)) return string.Empty;
            return PasswordHasherService.Hash(password);
        }

        public bool VerifyPassword(string inputPassword, string storedHash)
        {
            if (string.IsNullOrEmpty(storedHash)) return false;
            if (PasswordHasherService.Verify(inputPassword, storedHash)) return true;

            // Legacy fallback: accounts created before real hashing was added stored Base64(password).
            try
            {
                var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(storedHash));
                return decoded == inputPassword;
            }
            catch (FormatException)
            {
                return false;
            }
        }
    }
}
