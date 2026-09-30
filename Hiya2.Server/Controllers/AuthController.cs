using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;
using Hiya2.Server.Services;
using System.Security.Claims;

namespace Hiya2.Server.Controllers
{
    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IJwtTokenService _tokenService;
        private readonly IWebHostEnvironment _env;

        public AuthController(DataContext context, IJwtTokenService tokenService, IWebHostEnvironment env)
        {
            _context = context;
            _tokenService = tokenService;
            _env = env;
        }

        /// <summary>
        /// User Login API - Authenticates user credentials & returns JWT Token.
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (string.IsNullOrEmpty(dto.Email) || string.IsNullOrEmpty(dto.Password))
            {
                return BadRequest(new { message = "Email and password are required." });
            }

            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower() && !u.IsDeleted && u.IsActive);

            if (user == null || !PasswordHasherService.Verify(dto.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            if (PasswordHasherService.NeedsRehash(user.PasswordHash))
            {
                user.PasswordHash = PasswordHasherService.Hash(dto.Password);
                await _context.SaveChangesAsync();
            }

            var roles = user.UserRoles
                .Select(ur => ur.Role!)
                .Where(r => r != null && !r.IsDeleted && r.IsActive)
                .ToList();

            var roleIds = roles.Select(r => r.RoleId).ToList();

            var permissions = await _context.RoleMenuPermissions
                .Include(p => p.Menu)
                .Where(p => roleIds.Contains(p.RoleId) && p.Menu != null && (p.Menu.IsDeleted == false || p.Menu.IsDeleted == null) && (p.Menu.IsActive == true || p.Menu.IsActive == null))
                .ToListAsync();

            var token = _tokenService.GenerateToken(user, roles, permissions);

            return Ok(new
            {
                token,
                user = new
                {
                    user.UserId,
                    user.FirstName,
                    user.LastName,
                    user.Email,
                    user.MobileNo,
                    roles = roles.Select(r => new { r.RoleId, r.RoleName, r.RoleCode })
                }
            });
        }

        /// <summary>
        /// Dedicated Menu Permission API - Fetches allowed menus and action permissions by User ID or Role ID.
        /// Call examples: GET /api/auth/menu-permissions?userId=1 or GET /api/auth/menu-permissions?roleId=1
        /// </summary>
        [Authorize]
        [HttpGet("menu-permissions")]
        public async Task<IActionResult> GetMenuPermissions([FromQuery] long? userId, [FromQuery] int? roleId)
        {
            if (User.FindFirstValue("token_type") != "staff")
            {
                return Forbid();
            }

            List<int> targetRoleIds = new List<int>();

            if (roleId.HasValue && roleId.Value > 0)
            {
                targetRoleIds.Add(roleId.Value);
            }
            else
            {
                long resolvedUserId = userId ?? 0;
                if (resolvedUserId == 0 && User.Identity?.IsAuthenticated == true)
                {
                    var claimSub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
                    long.TryParse(claimSub, out resolvedUserId);
                }

                if (resolvedUserId > 0)
                {
                    targetRoleIds = await _context.UserRoles
                        .Where(ur => ur.UserId == resolvedUserId)
                        .Select(ur => ur.RoleId)
                        .ToListAsync();
                }
            }

            if (!targetRoleIds.Any())
            {
                targetRoleIds.Add(1);
            }

            var permissions = await _context.RoleMenuPermissions
                .Include(p => p.Menu)
                .Where(p => targetRoleIds.Contains(p.RoleId) && p.Menu != null && (p.Menu.IsDeleted == false || p.Menu.IsDeleted == null) && (p.Menu.IsActive == true || p.Menu.IsActive == null))
                .ToListAsync();

            var result = permissions.Select(p => new
            {
                permissionId = p.PermissionId,
                roleId = p.RoleId,
                menuId = p.MenuId,
                menuName = p.Menu?.Name,
                controller = p.Menu?.Controller,
                icon = p.Menu?.Icon,
                displayOrder = p.Menu?.DisplayOrder,
                canView = p.CanView,
                canAdd = p.CanAdd,
                canEdit = p.CanEdit,
                canDelete = p.CanDelete,
                canExport = p.CanExport
            }).OrderBy(p => p.displayOrder);

            return Ok(new
            {
                roleIds = targetRoleIds,
                permissions = result
            });
        }

        [HttpPost("seed-admin")]
        public async Task<IActionResult> SeedAdmin()
        {
            if (!_env.IsDevelopment())
            {
                return NotFound();
            }

            if (!await _context.Roles.AnyAsync(r => r.RoleCode == "SUPER_ADMIN"))
            {
                var adminRole = new Role
                {
                    RoleName = "Super Admin",
                    RoleCode = "SUPER_ADMIN",
                    Description = "Full access system administrator",
                    IsActive = true
                };
                await _context.Roles.AddAsync(adminRole);
                await _context.SaveChangesAsync();

                var adminUser = new User
                {
                    FirstName = "Vishal",
                    LastName = "Gami",
                    Email = "vmgami33333@gmail.com",
                    MobileNo = "9876543210",
                    PasswordHash = PasswordHasherService.Hash("admin123"),
                    IsActive = true
                };
                await _context.Users.AddAsync(adminUser);
                await _context.SaveChangesAsync();

                await _context.UserRoles.AddAsync(new UserRole
                {
                    UserId = adminUser.UserId,
                    RoleId = adminRole.RoleId
                });
                await _context.SaveChangesAsync();

                var menus = await _context.Menus.ToListAsync();
                foreach (var menu in menus)
                {
                    if (!await _context.RoleMenuPermissions.AnyAsync(p => p.RoleId == adminRole.RoleId && p.MenuId == menu.MenuId))
                    {
                        await _context.RoleMenuPermissions.AddAsync(new RoleMenuPermission
                        {
                            RoleId = adminRole.RoleId,
                            MenuId = menu.MenuId,
                            CanView = true,
                            CanAdd = true,
                            CanEdit = true,
                            CanDelete = true,
                            CanExport = true
                        });
                    }
                }
                await _context.SaveChangesAsync();

                return Ok(new { message = "Default Super Admin and System Menus successfully seeded!" });
            }

            return Ok(new { message = "System already seeded." });
        }
    }
}
