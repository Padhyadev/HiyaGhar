using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hiya2.Server.Models;
using Hiya2.Server.Repositories.HomePageComponent;

namespace Hiya2.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HomePageComponentController : ControllerBase
    {
        private readonly IHomePageComponentRepository _repository;

        public HomePageComponentController(IHomePageComponentRepository repository)
        {
            _repository = repository;
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(claim, out var id) ? id : 0;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var components = await _repository.GetAllAsync();
            return Ok(components);
        }

        [HttpGet("{key}")]
        public async Task<IActionResult> GetByKey(string key)
        {
            var component = await _repository.GetByKeyAsync(key);
            if (component == null)
            {
                return NotFound(new { message = $"Home Page Component with Key '{key}' not found." });
            }
            return Ok(component);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] HomePageComponent component)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            component.CreatedBy = GetCurrentUserId();

            var created = await _repository.AddAsync(component);
            return CreatedAtAction(nameof(GetByKey), new { key = created.Key }, created);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] HomePageComponent component)
        {
            if (id != component.Id)
            {
                return BadRequest(new { message = "Id in route does not match Component Id in body." });
            }

            component.LastModifiedBy = GetCurrentUserId();

            var success = await _repository.UpdateAsync(component);
            if (!success)
            {
                return NotFound(new { message = $"Component with Id {id} not found." });
            }

            return NoContent();
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _repository.DeleteAsync(id);
            if (!success)
            {
                return NotFound(new { message = $"Component with Id {id} not found." });
            }

            return NoContent();
        }

        [Authorize]
        [HttpPost("{id}/item")]
        public async Task<IActionResult> AddItem(int id, [FromBody] HomePageComponentItem item)
        {
            item.ComponentId = id;
            var success = await _repository.AddItemAsync(item);
            if (!success)
            {
                return BadRequest(new { message = "Failed to add item to component." });
            }
            return Ok(item);
        }

        [Authorize]
        [HttpDelete("item/{itemId}")]
        public async Task<IActionResult> DeleteItem(int itemId)
        {
            var success = await _repository.DeleteItemAsync(itemId);
            if (!success)
            {
                return NotFound(new { message = $"Item with Id {itemId} not found." });
            }
            return NoContent();
        }
    }
}
