using Microsoft.AspNetCore.Authorization;

namespace Hiya2.Server.Authorization
{
    /// <summary>
    /// Authorization policies. Customer and staff tokens are signed with the same key, so a plain
    /// [Authorize] lets ANY logged-in user through - including a guest-checkout token. Every admin
    /// endpoint must use [Authorize(Policy = AuthPolicies.Staff)].
    /// </summary>
    public static class AuthPolicies
    {
        /// <summary>Admin panel users only: the token carries token_type = "staff" (Services/JwtTokenService.cs).</summary>
        public const string Staff = "Staff";

        /// <summary>Registers the policies (used by Program.cs and the tests).</summary>
        public static void Configure(AuthorizationOptions options)
        {
            options.AddPolicy(Staff, policy => policy
                .RequireAuthenticatedUser()
                .RequireClaim("token_type", "staff"));
        }
    }
}
