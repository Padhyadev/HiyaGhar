using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hiya2.Server.Models;
using Hiya2.Server.Repositories.Category;

namespace Hiya2.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryRepository _categoryRepository;
        private readonly IWebHostEnvironment _environment;

        public CategoryController(ICategoryRepository categoryRepository, IWebHostEnvironment environment)
        {
            _categoryRepository = categoryRepository;
            _environment = environment;
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(claim, out var id) ? id : 0;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _categoryRepository.GetAllAsync();
            return Ok(categories);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
            {
                return NotFound(new { message = $"Category with Id {id} not found." });
            }
            return Ok(category);
        }

        private const long MaxFileSizeBytes = 2 * 1024 * 1024; // 2 MB

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromForm] Category category, IFormFile? imageFile)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                if (imageFile != null && imageFile.Length > 0)
                {
                    if (imageFile.Length > MaxFileSizeBytes)
                    {
                        return BadRequest(new { message = $"Image size ({imageFile.Length / (1024.0 * 1024.0):F2} MB) exceeds maximum allowed limit of 2 MB." });
                    }
                    category.ImagePath = await SaveImageAsync(imageFile);
                }
                else if (!string.IsNullOrEmpty(category.ImagePath) && category.ImagePath.StartsWith("data:image/"))
                {
                    category.ImagePath = await SaveBase64ImageAsync(category.ImagePath);
                }
                else if (string.IsNullOrEmpty(category.ImagePath))
                {
                    category.ImagePath = "/uploads/Noimage.png";
                }

                category.CreatedBy = GetCurrentUserId();

                var created = await _categoryRepository.AddAsync(category);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Failed to create category: {ex.Message}" });
            }
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] Category category, IFormFile? imageFile)
        {
            try
            {
                if (id != category.Id)
                {
                    return BadRequest(new { message = "Id in route parameter does not match Id in body." });
                }

                if (imageFile != null && imageFile.Length > 0)
                {
                    if (imageFile.Length > MaxFileSizeBytes)
                    {
                        return BadRequest(new { message = $"Image size ({imageFile.Length / (1024.0 * 1024.0):F2} MB) exceeds maximum allowed limit of 2 MB." });
                    }
                    category.ImagePath = await SaveImageAsync(imageFile);
                }
                else if (!string.IsNullOrEmpty(category.ImagePath) && category.ImagePath.StartsWith("data:image/"))
                {
                    category.ImagePath = await SaveBase64ImageAsync(category.ImagePath);
                }
                else if (string.IsNullOrEmpty(category.ImagePath))
                {
                    category.ImagePath = "/uploads/Noimage.png";
                }

                category.LastModifiedBy = GetCurrentUserId();

                var success = await _categoryRepository.UpdateAsync(category);
                if (!success)
                {
                    return NotFound(new { message = $"Category with Id {id} not found." });
                }

                return Ok(category);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Failed to update category: {ex.Message}" });
            }
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _categoryRepository.DeleteAsync(id);
            if (!success)
            {
                return NotFound(new { message = $"Category with Id {id} not found." });
            }

            return NoContent();
        }

        private async Task<string> SaveImageAsync(IFormFile file)
        {
            var webRoot = _environment.WebRootPath;
            if (string.IsNullOrEmpty(webRoot))
            {
                webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }

            var uploadDir = Path.Combine(webRoot, "uploads", "category");
            if (!Directory.Exists(uploadDir))
            {
                Directory.CreateDirectory(uploadDir);
            }

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/uploads/category/{fileName}";
        }

        private async Task<string> SaveBase64ImageAsync(string base64String)
        {
            try
            {
                var webRoot = _environment.WebRootPath;
                if (string.IsNullOrEmpty(webRoot))
                {
                    webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                }

                var uploadDir = Path.Combine(webRoot, "uploads", "category");
                if (!Directory.Exists(uploadDir))
                {
                    Directory.CreateDirectory(uploadDir);
                }

                var parts = base64String.Split(',');
                var header = parts.Length > 1 ? parts[0] : "";
                var data = parts.Length > 1 ? parts[1] : parts[0];

                string ext = ".png";
                if (header.Contains("image/jpeg") || header.Contains("image/jpg")) ext = ".jpg";
                else if (header.Contains("image/webp")) ext = ".webp";
                else if (header.Contains("image/gif")) ext = ".gif";

                var cleanData = data.Trim().Replace(" ", "+").Replace("\r", "").Replace("\n", "");
                var bytes = Convert.FromBase64String(cleanData);
                var fileName = $"{Guid.NewGuid()}{ext}";
                var filePath = Path.Combine(uploadDir, fileName);

                await System.IO.File.WriteAllBytesAsync(filePath, bytes);
                return $"/uploads/category/{fileName}";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in SaveBase64ImageAsync: {ex.Message}");
                return "/uploads/Noimage.png";
            }
        }
    }
}
