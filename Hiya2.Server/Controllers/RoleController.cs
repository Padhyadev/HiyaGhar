using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;

namespace Hiya2.Server.Controllers
{
    public class RolePermissionUpdateDto
    {
        public int MenuId { get; set; }
        public bool CanView { get; set; }
        public bool CanAdd { get; set; }
        public bool CanEdit { get; set; }
        public bool CanDelete { get; set; }
        public bool CanExport { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RoleController : ControllerBase
    {
        private readonly DataContext _context;

        public RoleController(DataContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var roles = await _context.Roles
                .Where(r => !r.IsDeleted)
                .OrderBy(r => r.RoleName)
                .ToListAsync();
            return Ok(roles);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var role = await _context.Roles
                .Include(r => r.RoleMenuPermissions)
                    .ThenInclude(p => p.Menu)
                .FirstOrDefaultAsync(r => r.RoleId == id && !r.IsDeleted);

            if (role == null)
            {
                return NotFound(new { message = $"Role with Id {id} not found." });
            }

            // Plain projection, not the tracked entity - EF's relationship fixup wires
            // RoleMenuPermission.Role back to this same instance, and serializing that
            // cycle (Role -> RoleMenuPermissions -> Role -> ...) throws.
            return Ok(new
            {
                role.RoleId,
                role.RoleName,
                role.RoleCode,
                role.Description,
                role.IsActive,
                permissions = role.RoleMenuPermissions.Select(p => new
                {
                    p.PermissionId,
                    p.MenuId,
                    menuName = p.Menu != null ? p.Menu.Name : null,
                    p.CanView,
                    p.CanAdd,
                    p.CanEdit,
                    p.CanDelete,
                    p.CanExport
                })
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Role role)
        {
            if (string.IsNullOrEmpty(role.RoleCode) || string.IsNullOrEmpty(role.RoleName))
            {
                return BadRequest(new { message = "RoleCode and RoleName are required." });
            }

            role.RoleCode = role.RoleCode.ToUpper().Trim();
            if (await _context.Roles.AnyAsync(r => r.RoleCode == role.RoleCode && !r.IsDeleted))
            {
                return BadRequest(new { message = $"Role with code '{role.RoleCode}' already exists." });
            }

            role.CreatedDate = DateTime.Now;
            role.IsDeleted = false;

            await _context.Roles.AddAsync(role);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = role.RoleId }, role);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Role role)
        {
            var existing = await _context.Roles.FindAsync(id);
            if (existing == null || existing.IsDeleted)
            {
                return NotFound(new { message = $"Role with Id {id} not found." });
            }

            existing.RoleName = role.RoleName;
            existing.Description = role.Description;
            existing.IsActive = role.IsActive;
            existing.LastModifiedDate = DateTime.Now;

            _context.Roles.Update(existing);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null || role.IsDeleted)
            {
                return NotFound(new { message = $"Role with Id {id} not found." });
            }

            role.IsActive = false;
            role.IsDeleted = true;
            role.LastModifiedDate = DateTime.Now;

            _context.Roles.Update(role);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("{id}/permissions")]
        public async Task<IActionResult> GetPermissions(int id)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null || role.IsDeleted)
            {
                return NotFound(new { message = $"Role with Id {id} not found." });
            }

            var permissions = await _context.RoleMenuPermissions
                .Where(p => p.RoleId == id)
                .Select(p => new
                {
                    p.PermissionId,
                    p.MenuId,
                    p.CanView,
                    p.CanAdd,
                    p.CanEdit,
                    p.CanDelete,
                    p.CanExport
                })
                .ToListAsync();

            return Ok(permissions);
        }

        [HttpPost("{id}/permissions")]
        public async Task<IActionResult> UpdatePermissions(int id, [FromBody] List<RolePermissionUpdateDto> permissions)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null || role.IsDeleted)
            {
                return NotFound(new { message = $"Role with Id {id} not found." });
            }

            var existingPerms = await _context.RoleMenuPermissions
                .Where(p => p.RoleId == id)
                .ToListAsync();

            _context.RoleMenuPermissions.RemoveRange(existingPerms);
            await _context.SaveChangesAsync();

            var newPerms = permissions.Select(dto =>
            {
                bool hasAccess = dto.CanView || dto.CanAdd || dto.CanEdit || dto.CanDelete;
                return new RoleMenuPermission
                {
                    RoleId = id,
                    MenuId = dto.MenuId,
                    CanView = hasAccess,
                    CanAdd = hasAccess,
                    CanEdit = hasAccess,
                    CanDelete = hasAccess,
                    CanExport = hasAccess,
                    CreatedDate = DateTime.Now
                };
            }).ToList();

            await _context.RoleMenuPermissions.AddRangeAsync(newPerms);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Role permissions updated successfully." });
        }
    }
}
