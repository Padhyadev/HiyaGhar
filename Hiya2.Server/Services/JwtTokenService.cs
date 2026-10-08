using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;
using Hiya2.Server.Models;

namespace Hiya2.Server.Services
{
    public class JwtTokenService : IJwtTokenService
    {
        private readonly IConfiguration _configuration;

        public JwtTokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(User user, IEnumerable<Role> roles, IEnumerable<RoleMenuPermission> permissions, string? sessionId = null)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var secretKey = jwtSettings["SecretKey"] ?? "HIYAGHAR_SUPER_SECRET_SECURITY_KEY_2026_PRODUCTION_GRADE_SECRET_KEY!";
            var issuer = jwtSettings["Issuer"] ?? "HIYAGHAR.Server";
            var audience = jwtSettings["Audience"] ?? "HIYAGHAR.Client";
            var expiryHours = double.TryParse(jwtSettings["ExpiryInHours"], out var h) ? h : 24;

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}".Trim()),
                new Claim("token_type", "staff"),
            };

            if (!string.IsNullOrEmpty(sessionId))
            {
                claims.Add(new Claim("session_id", sessionId));
            }

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role.RoleCode));
            }

            var permMap = new Dictionary<string, object>();
            foreach (var perm in permissions)
            {
                var menuKey = perm.Menu?.Name?.ToUpper().Replace(" ", "_");
                if (perm.Menu != null && !string.IsNullOrEmpty(menuKey))
                {
                    permMap[menuKey] = new
                    {
                        v = perm.CanView ? 1 : 0,
                        a = perm.CanAdd ? 1 : 0,
                        e = perm.CanEdit ? 1 : 0,
                        d = perm.CanDelete ? 1 : 0,
                        x = perm.CanExport ? 1 : 0
                    };
                }
            }

            claims.Add(new Claim("permissions", JsonSerializer.Serialize(permMap)));

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(expiryHours),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
