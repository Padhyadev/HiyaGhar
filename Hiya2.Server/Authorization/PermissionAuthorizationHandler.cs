using System.Text.Json;
using Microsoft.AspNetCore.Authorization;

namespace Hiya2.Server.Authorization
{
    public class PermissionRequirement : IAuthorizationRequirement
    {
        public string MenuKey { get; }
        public PermissionAction Action { get; }

        public PermissionRequirement(string menuKey, PermissionAction action)
        {
            MenuKey = menuKey;
            Action = action;
        }
    }

    public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
    {
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
        {
            if (context.User == null || context.User.Identity?.IsAuthenticated != true)
            {
                return Task.CompletedTask;
            }

            if (context.User.IsInRole("SUPER_ADMIN") || context.User.IsInRole("SUPERADMIN"))
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }

            var permClaim = context.User.FindFirst("permissions")?.Value;
            if (string.IsNullOrEmpty(permClaim))
            {
                return Task.CompletedTask;
            }

            try
            {
                using var doc = JsonDocument.Parse(permClaim);
                if (doc.RootElement.TryGetProperty(requirement.MenuKey, out var menuPerm))
                {
                    string propName = requirement.Action switch
                    {
                        PermissionAction.CanView => "v",
                        PermissionAction.CanAdd => "a",
                        PermissionAction.CanEdit => "e",
                        PermissionAction.CanDelete => "d",
                        PermissionAction.CanExport => "x",
                        _ => "v"
                    };

                    if (menuPerm.TryGetProperty(propName, out var val) && val.GetInt32() == 1)
                    {
                        context.Succeed(requirement);
                    }
                }
            }
            catch
            {
                // Fallthrough to unhandled requirement
            }

            return Task.CompletedTask;
        }
    }

    public class DynamicPermissionPolicyProvider : IAuthorizationPolicyProvider
    {
        private readonly DefaultAuthorizationPolicyProvider _fallbackPolicyProvider;

        public DynamicPermissionPolicyProvider(Microsoft.Extensions.Options.IOptions<AuthorizationOptions> options)
        {
            _fallbackPolicyProvider = new DefaultAuthorizationPolicyProvider(options);
        }

        public Task<AuthorizationPolicy> GetDefaultPolicyAsync() => _fallbackPolicyProvider.GetDefaultPolicyAsync();

        public Task<AuthorizationPolicy?> GetFallbackPolicyAsync() => _fallbackPolicyProvider.GetFallbackPolicyAsync();

        public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
        {
            if (policyName.Contains(":"))
            {
                var parts = policyName.Split(':');
                var menuKey = parts[0];
                if (Enum.TryParse<PermissionAction>(parts[1], out var action))
                {
                    var policy = new AuthorizationPolicyBuilder();
                    policy.AddRequirements(new PermissionRequirement(menuKey, action));
                    return Task.FromResult<AuthorizationPolicy?>(policy.Build());
                }
            }
            return _fallbackPolicyProvider.GetPolicyAsync(policyName);
        }
    }
}
