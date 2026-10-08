using Hiya2.Server.Models;

namespace Hiya2.Server.Services
{
    public interface IJwtTokenService
    {
        string GenerateToken(User user, IEnumerable<Role> roles, IEnumerable<RoleMenuPermission> permissions, string? sessionId = null);
    }
}
