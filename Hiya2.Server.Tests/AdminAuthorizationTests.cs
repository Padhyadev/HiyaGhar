using System.Reflection;
using System.Security.Claims;
using Hiya2.Server.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace Hiya2.Server.Tests;

/// <summary>
/// Customer/guest and staff tokens are signed with the same key, so admin endpoints must require the
/// Staff policy - a plain [Authorize] lets a guest-checkout token create admin users.
/// </summary>
public class AdminAuthorizationTests
{
    // Controllers that only serve the admin panel (public reads are [AllowAnonymous]).
    private static readonly string[] AdminControllers =
    {
        "UserController", "RoleController", "MenuController", "StockController", "StockReservationController",
        "StockSettingController", "AttributeController", "CouponController", "ProductController", "CategoryController",
        "ShippingSettingController", "LovController", "FaqController", "HomePageComponentController",
        "NewsletterController", "ContactQueryController", "ReviewController", "AuthController",
    };

    // Logged-in actions in those controllers that customers (or the staff check inside the action) handle.
    private static readonly string[] AllowedForCustomers =
    {
        "ReviewController.Add",              // customers post reviews (buyer check inside)
        "ReviewController.CanReview",        // customers: may I review this product?
        "AuthController.GetMenuPermissions", // checks token_type == staff inside the action
    };

    [Fact]
    public void Every_logged_in_admin_endpoint_requires_the_staff_policy()
    {
        var missing = new List<string>();
        var controllers = typeof(AuthPolicies).Assembly.GetTypes().Where(t => AdminControllers.Contains(t.Name)).ToList();
        Assert.Equal(AdminControllers.Length, controllers.Count);

        foreach (var controller in controllers)
        {
            var classAuth = controller.GetCustomAttributes<AuthorizeAttribute>().ToList();
            foreach (var action in controller.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly)
                         .Where(m => m.GetCustomAttributes().Any(a => a is Microsoft.AspNetCore.Mvc.Routing.HttpMethodAttribute)))
            {
                if (action.GetCustomAttributes<AllowAnonymousAttribute>().Any()) continue;
                var auth = classAuth.Concat(action.GetCustomAttributes<AuthorizeAttribute>()).ToList();
                if (auth.Count == 0) continue; // public endpoint (no auth at all)
                var name = $"{controller.Name}.{action.Name}";
                if (AllowedForCustomers.Contains(name)) continue;
                if (!auth.Any(a => a.Policy == AuthPolicies.Staff)) missing.Add(name);
            }
        }

        Assert.True(missing.Count == 0, "Admin endpoints without the Staff policy: " + string.Join(", ", missing));
    }

    [Theory]
    [InlineData("staff", true)]
    [InlineData("customer", false)]
    [InlineData(null, false)]
    public async Task Staff_policy_accepts_only_staff_tokens(string? tokenType, bool allowed)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAuthorization(AuthPolicies.Configure);
        var authz = services.BuildServiceProvider().GetRequiredService<IAuthorizationService>();

        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, "1") };
        if (tokenType != null) claims.Add(new Claim("token_type", tokenType));
        var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));

        var result = await authz.AuthorizeAsync(user, null, AuthPolicies.Staff);
        Assert.Equal(allowed, result.Succeeded);
    }
}
