using Microsoft.AspNetCore.Authorization;

namespace Hiya2.Server.Authorization
{
    public class HasPermissionAttribute : AuthorizeAttribute
    {
        public string MenuKey { get; }
        public PermissionAction Action { get; }

        public HasPermissionAttribute(string menuKey, PermissionAction action)
            : base(policy: $"{menuKey}:{action}")
        {
            MenuKey = menuKey;
            Action = action;
        }
    }
}
