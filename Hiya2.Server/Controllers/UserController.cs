using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;
using Hiya2.Server.Services;

namespace Hiya2.Server.Controllers
{
    public class UserDto
    {
        public long UserId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string MobileNo { get; set; } = string.Empty;
        public string? Password { get; set; }
        public string? Username { get; set; }
        public bool IsActive { get; set; } = true;
        public List<int> RoleIds { get; set; } = new List<int>();
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly DataContext _context;

        public UserController(DataContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .Where(u => !u.IsDeleted)
                .Select(u => new
                {
                    u.UserId,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.MobileNo,
                    u.Username,
                    u.IsActive,
                    u.CreatedDate,
                    roles = u.UserRoles.Select(ur => new { ur.Role!.RoleId, ur.Role!.RoleName, ur.Role!.RoleCode })
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.UserId == id && !u.IsDeleted);

            if (user == null)
            {
                return NotFound(new { message = $"User with Id {id} not found." });
            }

            return Ok(new
            {
                user.UserId,
                user.FirstName,
                user.LastName,
                user.Email,
                user.MobileNo,
                user.Username,
                user.IsActive,
                roles = user.UserRoles.Select(ur => new { ur.Role!.RoleId, ur.Role!.RoleName, ur.Role!.RoleCode })
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] UserDto dto)
        {
            if (string.IsNullOrEmpty(dto.Email) || string.IsNullOrEmpty(dto.Password))
            {
                return BadRequest(new { message = "Email and Password are required." });
            }

            dto.Email = dto.Email.ToLower().Trim();
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email && !u.IsDeleted))
            {
                return BadRequest(new { message = $"The email '{dto.Email}' is already in use by another account." });
            }

            var user = new User
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                MobileNo = dto.MobileNo,
                PasswordHash = PasswordHasherService.Hash(dto.Password),
                Username = string.IsNullOrWhiteSpace(dto.Username) ? null : dto.Username.Trim(),
                IsActive = dto.IsActive,
                CreatedDate = DateTime.Now,
                IsDeleted = false
            };

            await _context.Users.AddAsync(user);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // The Email column has an unfiltered unique index at the DB level, so a
                // soft-deleted user can still occupy an email the check above didn't see.
                return BadRequest(new { message = $"The email '{dto.Email}' is already in use by another account." });
            }

            if (dto.RoleIds != null && dto.RoleIds.Count > 0)
            {
                foreach (var roleId in dto.RoleIds)
                {
                    await _context.UserRoles.AddAsync(new UserRole
                    {
                        UserId = user.UserId,
                        RoleId = roleId
                    });
                }
                await _context.SaveChangesAsync();
            }

            // Return a plain projection, not the tracked entity - EF Core's relationship
            // fixup wires UserRole.User back to this same user instance once UserRoles are
            // added, and serializing that cycle (user -> UserRoles -> User -> ...) throws.
            return CreatedAtAction(nameof(GetById), new { id = user.UserId }, new
            {
                user.UserId,
                user.FirstName,
                user.LastName,
                user.Email,
                user.MobileNo,
                user.Username,
                user.IsActive,
                user.CreatedDate
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(long id, [FromBody] UserDto dto)
        {
            var existing = await _context.Users
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.UserId == id && !u.IsDeleted);

            if (existing == null)
            {
                return NotFound(new { message = $"User with Id {id} not found." });
            }

            existing.FirstName = dto.FirstName;
            existing.LastName = dto.LastName;
            if (!string.IsNullOrEmpty(dto.Email))
            {
                var normalizedEmail = dto.Email.ToLower().Trim();
                if (normalizedEmail != existing.Email &&
                    await _context.Users.AnyAsync(u => u.Email == normalizedEmail && u.UserId != id && !u.IsDeleted))
                {
                    return BadRequest(new { message = $"The email '{normalizedEmail}' is already in use by another account." });
                }
                existing.Email = normalizedEmail;
            }
            existing.MobileNo = dto.MobileNo;
            existing.Username = string.IsNullOrWhiteSpace(dto.Username) ? null : dto.Username.Trim();
            existing.IsActive = dto.IsActive;
            if (!string.IsNullOrEmpty(dto.Password))
            {
                existing.PasswordHash = PasswordHasherService.Hash(dto.Password);
            }
            existing.LastModifiedDate = DateTime.Now;

            _context.Users.Update(existing);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // The Email column has an unfiltered unique index at the DB level, so a
                // soft-deleted user can still occupy an email the check above didn't see.
                return BadRequest(new { message = $"The email '{existing.Email}' is already in use by another account." });
            }

            if (dto.RoleIds != null)
            {
                _context.UserRoles.RemoveRange(existing.UserRoles);
                await _context.SaveChangesAsync();

                foreach (var roleId in dto.RoleIds)
                {
                    await _context.UserRoles.AddAsync(new UserRole
                    {
                        UserId = existing.UserId,
                        RoleId = roleId
                    });
                }
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(long id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null || user.IsDeleted)
            {
                return NotFound(new { message = $"User with Id {id} not found." });
            }

            user.IsActive = false;
            user.IsDeleted = true;
            user.LastModifiedDate = DateTime.Now;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
