using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hiya2.Server.Models;
using Hiya2.Server.Repositories.GiftHamper;

namespace Hiya2.Server.Controllers
{
    public class SetOccasionProductsRequestDto
    {
        public List<int> ProductIds { get; set; } = new();
    }

    [ApiController]
    [Route("api/[controller]")]
    public class GiftHamperController : ControllerBase
    {
        private readonly IGiftHamperRepository _repository;
        private readonly IWebHostEnvironment _environment;

        public GiftHamperController(IGiftHamperRepository repository, IWebHostEnvironment environment)
        {
            _repository = repository;
            _environment = environment;
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(claim, out var id) ? id : 0;
        }

        private const long MaxFileSizeBytes = 2 * 1024 * 1024; // 2 MB

        private static object ToOccasionDto(GiftHamperOccasion o) => new
        {
            id = o.Id,
            name = o.Name,
            slug = o.Slug,
            description = o.Description,
            bannerImagePath = o.BannerImagePath,
            displayOrder = o.DisplayOrder,
            isActive = o.IsActive,
            products = o.Products
                .Where(p => p.Product != null)
                .OrderBy(p => p.DisplayOrder)
                .Select(p => new
                {
                    id = p.Product!.Id,
                    categoryId = p.Product.CategoryId,
                    productName = p.Product.ProductName,
                    shortDescription = p.Product.ShortDescription,
                    mainImagePath = p.Product.MainImagePath,
                    basePrice = p.Product.BasePrice,
                    discountPrice = p.Product.DiscountPrice,
                    rating = p.Product.Rating,
                    reviewCount = p.Product.ReviewCount,
                    variants = p.Product.Variants.Select(v => new
                    {
                        v.Id,
                        v.VariantName,
                        v.SKU,
                        v.Price,
                        v.OriginalPrice,
                        StockQuantity = v.AvailableStock,
                        v.IsInStock,
                        v.IsDefault
                    }),
                    images = p.Product.Images.Select(i => new { i.Id, i.ImagePath, i.DisplayOrder, i.IsPrimary })
                })
        };

        [HttpGet("occasions")]
        public async Task<IActionResult> GetAllOccasions([FromQuery] bool onlyActive = false)
        {
            var occasions = await _repository.GetAllOccasionsAsync(onlyActive);
            return Ok(occasions.Select(ToOccasionDto));
        }

        [HttpGet("occasions/{slug}")]
        public async Task<IActionResult> GetBySlug(string slug)
        {
            var occasion = await _repository.GetBySlugAsync(slug);
            if (occasion == null)
            {
                return NotFound(new { message = $"Occasion '{slug}' not found." });
            }
            return Ok(ToOccasionDto(occasion));
        }

        [Authorize]
        [HttpPost("occasions")]
        public async Task<IActionResult> Create([FromForm] GiftHamperOccasion occasion, IFormFile? bannerImage)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(occasion.Name) || string.IsNullOrWhiteSpace(occasion.Slug))
                {
                    return BadRequest(new { message = "Name and Slug are required." });
                }

                if (bannerImage != null && bannerImage.Length > 0)
                {
                    if (bannerImage.Length > MaxFileSizeBytes)
                    {
                        return BadRequest(new { message = $"Image size ({bannerImage.Length / (1024.0 * 1024.0):F2} MB) exceeds maximum allowed limit of 2 MB." });
                    }
                    occasion.BannerImagePath = await SaveImageAsync(bannerImage);
                }
                else if (!string.IsNullOrEmpty(occasion.BannerImagePath) && occasion.BannerImagePath.StartsWith("data:image/"))
                {
                    occasion.BannerImagePath = await SaveBase64ImageAsync(occasion.BannerImagePath);
                }
                else if (string.IsNullOrEmpty(occasion.BannerImagePath))
                {
                    occasion.BannerImagePath = "/uploads/Noimage.png";
                }

                occasion.CreatedBy = GetCurrentUserId();

                var created = await _repository.AddAsync(occasion);
                return Ok(ToOccasionDto(created));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Failed to create occasion: {ex.Message}" });
            }
        }

        [Authorize]
        [HttpPut("occasions/{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] GiftHamperOccasion occasion, IFormFile? bannerImage)
        {
            try
            {
                occasion.Id = id;

                if (bannerImage != null && bannerImage.Length > 0)
                {
                    if (bannerImage.Length > MaxFileSizeBytes)
                    {
                        return BadRequest(new { message = $"Image size ({bannerImage.Length / (1024.0 * 1024.0):F2} MB) exceeds maximum allowed limit of 2 MB." });
                    }
                    occasion.BannerImagePath = await SaveImageAsync(bannerImage);
                }
                else if (!string.IsNullOrEmpty(occasion.BannerImagePath) && occasion.BannerImagePath.StartsWith("data:image/"))
                {
                    occasion.BannerImagePath = await SaveBase64ImageAsync(occasion.BannerImagePath);
                }

                occasion.LastModifiedBy = GetCurrentUserId();

                var success = await _repository.UpdateAsync(occasion);
                if (!success)
                {
                    return NotFound(new { message = $"Occasion with Id {id} not found." });
                }

                var updated = await _repository.GetByIdAsync(id);
                return Ok(updated == null ? null : ToOccasionDto(updated));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Failed to update occasion: {ex.Message}" });
            }
        }

        [Authorize]
        [HttpDelete("occasions/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _repository.DeleteAsync(id);
            if (!success)
            {
                return NotFound(new { message = $"Occasion with Id {id} not found." });
            }
            return NoContent();
        }

        [Authorize]
        [HttpPut("occasions/{id}/products")]
        public async Task<IActionResult> SetProducts(int id, [FromBody] SetOccasionProductsRequestDto dto)
        {
            var success = await _repository.SetProductsAsync(id, dto.ProductIds ?? new List<int>());
            if (!success)
            {
                return NotFound(new { message = $"Occasion with Id {id} not found." });
            }

            var updated = await _repository.GetByIdAsync(id);
            return Ok(updated == null ? null : ToOccasionDto(updated));
        }

        private async Task<string> SaveImageAsync(IFormFile file)
        {
            var webRoot = _environment.WebRootPath;
            if (string.IsNullOrEmpty(webRoot))
            {
                webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }

            var uploadDir = Path.Combine(webRoot, "uploads", "gifthamper");
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

            return $"/uploads/gifthamper/{fileName}";
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

                var uploadDir = Path.Combine(webRoot, "uploads", "gifthamper");
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
                return $"/uploads/gifthamper/{fileName}";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in SaveBase64ImageAsync: {ex.Message}");
                return "/uploads/Noimage.png";
            }
        }
    }
}
