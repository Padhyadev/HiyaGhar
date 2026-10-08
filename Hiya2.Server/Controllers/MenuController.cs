using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;

namespace Hiya2.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MenuController : ControllerBase
    {
        private readonly DataContext _context;

        public MenuController(DataContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var menus = await _context.Menus
                .Where(m => (m.IsDeleted == false || m.IsDeleted == null) && (m.IsActive == true || m.IsActive == null))
                .OrderBy(m => m.DisplayOrder)
                .ToListAsync();
            return Ok(menus);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Menu menu)
        {
            if (string.IsNullOrWhiteSpace(menu.Name))
            {
                return BadRequest(new { message = "Please enter Menu Name." });
            }

            menu.CreatedDate = DateTime.Now;
            menu.IsDeleted = false;
            menu.IsActive = true;

            await _context.Menus.AddAsync(menu);
            await _context.SaveChangesAsync();

            return Ok(menu);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Menu menu)
        {
            var existing = await _context.Menus.FindAsync(id);
            if (existing == null || existing.IsDeleted == true)
            {
                return NotFound(new { message = $"Menu with Id {id} not found." });
            }

            existing.Name = menu.Name;
            existing.ParentId = menu.ParentId;
            existing.Controller = menu.Controller;
            existing.Icon = menu.Icon;
            existing.DisplayOrder = menu.DisplayOrder;
            existing.SuperAdmin = menu.SuperAdmin;
            existing.IsActive = menu.IsActive;
            existing.LastModifiedDate = DateTime.Now;

            _context.Menus.Update(existing);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var menu = await _context.Menus.FindAsync(id);
            if (menu == null || menu.IsDeleted == true)
            {
                return NotFound(new { message = $"Menu with Id {id} not found." });
            }

            menu.IsActive = false;
            menu.IsDeleted = true;
            menu.LastModifiedDate = DateTime.Now;

            _context.Menus.Update(menu);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
