using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;
using Hiya2.Server.Repositories.Product;

namespace Hiya2.Server.Controllers
{
    public class AttributeNameValueDto
    {
        public string AttributeName { get; set; } = string.Empty;
        public string AttributeValue { get; set; } = string.Empty;
    }

    public class IncomingVariantDto
    {
        public int Id { get; set; }
        public string? Sku { get; set; }
        public List<AttributeNameValueDto>? Attributes { get; set; }
        public string? VariantName { get; set; }
        public decimal OriginalPrice { get; set; }
        public decimal Price { get; set; }
        public bool IsDefault { get; set; }
    }

    public class IncomingImageDto
    {
        public int? Id { get; set; }
        public string ImagePath { get; set; } = string.Empty;
        public bool IsPrimary { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly IProductRepository _productRepository;
        private readonly IWebHostEnvironment _environment;
        private readonly DataContext _context;

        public ProductController(IProductRepository productRepository, IWebHostEnvironment environment, DataContext context)
        {
            _productRepository = productRepository;
            _environment = environment;
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(claim, out var id) ? id : 0;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? categoryId, [FromQuery] bool? isFeatured, [FromQuery] bool? onlyActive)
        {
            try
            {
                var products = await _productRepository.GetAllAsync(categoryId, isFeatured, onlyActive);
                var result = products.Select(p => new
                {
                    id = p.Id,
                    productName = p.ProductName,
                    categoryId = p.CategoryId,
                    categoryName = p.Category != null ? p.Category.CategoryName : "General",
                    shortDescription = p.ShortDescription,
                    fullDescription = p.FullDescription,
                    mainImagePath = p.MainImagePath,
                    basePrice = p.BasePrice,
                    discountPrice = p.DiscountPrice,
                    rating = p.Rating,
                    reviewCount = p.ReviewCount,
                    isBestseller = p.IsFeatured,
                    isActive = p.IsActive,
                    variants = p.Variants.Where(v => !v.IsDeleted).Select(v => BuildVariantResponse(v)),
                    images = p.Images.Where(i => !i.IsDeleted)
                        .OrderByDescending(i => i.IsPrimary).ThenBy(i => i.DisplayOrder)
                        .Select(i => new
                        {
                            id = i.Id,
                            imagePath = i.ImagePath,
                            isPrimary = i.IsPrimary,
                            displayOrder = i.DisplayOrder
                        })
                });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Failed to get products: {ex.Message}" });
            }
        }

        private static List<AttributeNameValueDto> ParseVariantAttributes(ProductVariant v)
        {
            var result = new List<AttributeNameValueDto>();

            if (string.IsNullOrWhiteSpace(v.VariantName) || v.VariantName == "No Variant")
            {
                return result;
            }

            // VariantName holds one or more "AttributeName: Value" segments, comma-separated,
            // e.g. "Weight: 200 g, Packing: Pouch" - this is the sole source of truth, no separate column.
            foreach (var segment in v.VariantName.Split(','))
            {
                var trimmed = segment.Trim();
                if (trimmed.Length == 0) continue;

                var idx = trimmed.IndexOf(':');
                if (idx >= 0)
                {
                    result.Add(new AttributeNameValueDto
                    {
                        AttributeName = trimmed.Substring(0, idx).Trim(),
                        AttributeValue = trimmed.Substring(idx + 1).Trim()
                    });
                }
                else
                {
                    result.Add(new AttributeNameValueDto { AttributeName = "Weight", AttributeValue = trimmed });
                }
            }

            return result;
        }

        private static object BuildVariantResponse(ProductVariant v)
        {
            var attrs = ParseVariantAttributes(v);
            var first = attrs.Count > 0 ? attrs[0] : new AttributeNameValueDto { AttributeName = "Weight", AttributeValue = v.VariantName };
            return new
            {
                id = v.Id,
                sku = v.SKU,
                attributeName = first.AttributeName,
                attributeValue = first.AttributeValue,
                attributes = attrs.Select(a => new { attributeName = a.AttributeName, attributeValue = a.AttributeValue }),
                variantName = v.VariantName,
                originalPrice = v.OriginalPrice ?? v.Price,
                price = v.Price,
                stockQuantity = v.AvailableStock,
                reservedStock = v.ReservedStock,
                sellableStock = v.AvailableStock - v.ReservedStock,
                isDefault = v.IsDefault
            };
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var p = await _productRepository.GetByIdAsync(id);
            if (p == null)
            {
                return NotFound(new { message = $"Product with Id {id} not found." });
            }
            return Ok(new
            {
                id = p.Id,
                productName = p.ProductName,
                categoryId = p.CategoryId,
                categoryName = p.Category != null ? p.Category.CategoryName : "General",
                shortDescription = p.ShortDescription,
                fullDescription = p.FullDescription,
                mainImagePath = p.MainImagePath,
                basePrice = p.BasePrice,
                discountPrice = p.DiscountPrice,
                rating = p.Rating,
                reviewCount = p.ReviewCount,
                isBestseller = p.IsFeatured,
                isActive = p.IsActive,
                variants = p.Variants.Where(v => !v.IsDeleted).Select(v => BuildVariantResponse(v)),
                images = p.Images.Where(i => !i.IsDeleted)
                    .OrderByDescending(i => i.IsPrimary).ThenBy(i => i.DisplayOrder)
                    .Select(i => new
                    {
                        id = i.Id,
                        imagePath = i.ImagePath,
                        isPrimary = i.IsPrimary,
                        displayOrder = i.DisplayOrder
                    })
            });
        }

        private const long MaxFileSizeBytes = 2 * 1024 * 1024; // 2 MB

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromForm] Product product, [FromForm] string? categoryName, IFormFile? mainImage, [FromForm] string? variantsJson, [FromForm] string? imagesJson)
        {
            try
            {
                ModelState.Remove("Category");
                ModelState.Remove("Variants");
                ModelState.Remove("Images");

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                if (mainImage != null && mainImage.Length > 0)
                {
                    if (mainImage.Length > MaxFileSizeBytes)
                    {
                        return BadRequest(new { message = $"Image size ({mainImage.Length / (1024.0 * 1024.0):F2} MB) exceeds maximum allowed limit of 2 MB." });
                    }
                    product.MainImagePath = await SaveImageAsync(mainImage);
                }
                else if (!string.IsNullOrEmpty(product.MainImagePath) && product.MainImagePath.StartsWith("data:image/"))
                {
                    product.MainImagePath = await SaveBase64ImageAsync(product.MainImagePath);
                }
                else if (string.IsNullOrEmpty(product.MainImagePath))
                {
                    product.MainImagePath = "/uploads/Noimage.png";
                }

                var catName = !string.IsNullOrWhiteSpace(categoryName) ? categoryName : Request.Form["CategoryName"].ToString();
                if (product.CategoryId <= 0 && !string.IsNullOrWhiteSpace(catName))
                {
                    var matchedCat = await _context.Categories
                        .FirstOrDefaultAsync(c => !c.IsDeleted && c.CategoryName.ToLower() == catName.Trim().ToLower());
                    if (matchedCat != null)
                    {
                        product.CategoryId = matchedCat.Id;
                    }
                }

                if (product.CategoryId <= 0)
                {
                    var firstCategory = await _context.Categories.FirstOrDefaultAsync(c => !c.IsDeleted);
                    if (firstCategory != null)
                    {
                        product.CategoryId = firstCategory.Id;
                    }
                    else
                    {
                        var defaultCat = new Category
                        {
                            CategoryName = "General",
                            SKU = "GEN-01",
                            Description = "General Category",
                            IsActive = true,
                            IsDeleted = false,
                            CreatedDate = DateTime.Now
                        };
                        await _context.Categories.AddAsync(defaultCat);
                        await _context.SaveChangesAsync();
                        product.CategoryId = defaultCat.Id;
                    }
                }

                product.CreatedBy = GetCurrentUserId();

                var created = await _productRepository.AddAsync(product);

                // Save variants if provided
                await SaveVariantsFromJsonAsync(created.Id, variantsJson);

                // Save the full gallery (with primary flag) if provided — replaces the
                // single-mainImage-only handling above with the authoritative image list.
                await SaveImagesFromJsonAsync(created.Id, imagesJson);

                return Ok(new
                {
                    id = created.Id,
                    productName = created.ProductName,
                    categoryId = created.CategoryId,
                    mainImagePath = created.MainImagePath,
                    basePrice = created.BasePrice,
                    discountPrice = created.DiscountPrice,
                    shortDescription = created.ShortDescription,
                    fullDescription = created.FullDescription,
                    isBestseller = created.IsFeatured,
                    isActive = created.IsActive
                });
            }
            catch (Exception ex)
            {
                var innerMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, new { message = $"Failed to create product: {innerMsg}" });
            }
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] Product product, [FromForm] string? categoryName, IFormFile? mainImage, [FromForm] string? variantsJson, [FromForm] string? imagesJson)
        {
            try
            {
                if (id != product.Id)
                {
                    return BadRequest(new { message = "Id in route does not match Product Id in body." });
                }

                ModelState.Remove("Category");
                ModelState.Remove("Variants");
                ModelState.Remove("Images");

                if (mainImage != null && mainImage.Length > 0)
                {
                    if (mainImage.Length > MaxFileSizeBytes)
                    {
                        return BadRequest(new { message = $"Image size ({mainImage.Length / (1024.0 * 1024.0):F2} MB) exceeds maximum allowed limit of 2 MB." });
                    }
                    product.MainImagePath = await SaveImageAsync(mainImage);
                }
                else if (!string.IsNullOrEmpty(product.MainImagePath) && product.MainImagePath.StartsWith("data:image/"))
                {
                    product.MainImagePath = await SaveBase64ImageAsync(product.MainImagePath);
                }
                else if (string.IsNullOrEmpty(product.MainImagePath))
                {
                    product.MainImagePath = "/uploads/Noimage.png";
                }

                var catName = !string.IsNullOrWhiteSpace(categoryName) ? categoryName : Request.Form["CategoryName"].ToString();
                if (product.CategoryId <= 0 && !string.IsNullOrWhiteSpace(catName))
                {
                    var matchedCat = await _context.Categories
                        .FirstOrDefaultAsync(c => !c.IsDeleted && c.CategoryName.ToLower() == catName.Trim().ToLower());
                    if (matchedCat != null)
                    {
                        product.CategoryId = matchedCat.Id;
                    }
                }

                if (product.CategoryId <= 0)
                {
                    var firstCategory = await _context.Categories.FirstOrDefaultAsync(c => !c.IsDeleted);
                    if (firstCategory != null)
                    {
                        product.CategoryId = firstCategory.Id;
                    }
                }

                product.LastModifiedBy = GetCurrentUserId();

                var success = await _productRepository.UpdateAsync(product);
                if (!success)
                {
                    return NotFound(new { message = $"Product with Id {id} not found." });
                }

                // Update variants if provided
                await SaveVariantsFromJsonAsync(id, variantsJson);

                // Update the full gallery (with primary flag) if provided.
                await SaveImagesFromJsonAsync(id, imagesJson);

                return Ok(new { message = "Product updated successfully." });
            }
            catch (Exception ex)
            {
                var innerMsg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, new { message = $"Failed to update product: {innerMsg}" });
            }
        }

        private async Task SaveVariantsFromJsonAsync(int productId, string? variantsJson)
        {
            if (string.IsNullOrWhiteSpace(variantsJson)) return;

            try
            {
                var existingVars = await _context.ProductVariants
                    .Where(v => v.ProductId == productId && !v.IsDeleted)
                    .ToListAsync();

                // Stock is managed exclusively through the Stock Management admin page now -
                // this form no longer accepts a stock value. Since every save recreates variant
                // rows from scratch, carry over each existing variant's stock (matched by SKU)
                // so editing a product's price/name/images doesn't silently zero out its stock.
                var stockBySku = existingVars
                    .Where(ev => !string.IsNullOrWhiteSpace(ev.SKU))
                    .GroupBy(ev => ev.SKU.Trim().ToUpperInvariant())
                    .ToDictionary(g => g.Key, g => g.First());

                foreach (var ev in existingVars)
                {
                    ev.IsDeleted = true;
                    ev.LastModifiedDate = DateTime.Now;
                }

                var items = System.Text.Json.JsonSerializer.Deserialize<List<IncomingVariantDto>>(
                    variantsJson,
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );

                if (items != null && items.Count > 0)
                {
                    foreach (var v in items)
                    {
                        var attrs = (v.Attributes ?? new List<AttributeNameValueDto>())
                            .Where(a => !string.IsNullOrWhiteSpace(a.AttributeName) && !string.IsNullOrWhiteSpace(a.AttributeValue))
                            .ToList();

                        string comboName;
                        if (attrs.Count == 0 || attrs.Any(a => a.AttributeName == "No Variant" || a.AttributeName == "NONE"))
                        {
                            comboName = "No Variant";
                        }
                        else
                        {
                            comboName = string.Join(", ", attrs.Select(a => $"{a.AttributeName}: {a.AttributeValue}"));
                        }

                        var sku = !string.IsNullOrWhiteSpace(v.Sku) ? v.Sku : $"SKU-{Guid.NewGuid().ToString().Substring(0, 5)}";
                        stockBySku.TryGetValue(sku.Trim().ToUpperInvariant(), out var carriedOverStock);

                        var pv = new ProductVariant
                        {
                            ProductId = productId,
                            VariantName = comboName,
                            SKU = sku,
                            Price = v.Price > 0 ? v.Price : 149,
                            OriginalPrice = v.OriginalPrice > 0 ? v.OriginalPrice : (v.Price > 0 ? v.Price : 199),
                            AvailableStock = carriedOverStock?.AvailableStock ?? 0,
                            ReservedStock = carriedOverStock?.ReservedStock ?? 0,
                            LowStockThreshold = carriedOverStock?.LowStockThreshold,
                            IsInStock = carriedOverStock?.IsInStock ?? true,
                            IsDefault = v.IsDefault,
                            IsActive = true,
                            IsDeleted = false,
                            CreatedDate = DateTime.Now
                        };
                        await _context.ProductVariants.AddAsync(pv);
                    }
                }
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving variants from JSON: {ex.Message}");
            }
        }

        // Full-replace of a product's gallery images, mirroring SaveVariantsFromJsonAsync's
        // pattern: soft-delete everything existing for this product, then reinsert fresh rows
        // from the incoming JSON list (array order = DisplayOrder). Also keeps Product.MainImagePath
        // in sync with whichever image ends up primary, since other parts of the app (category
        // listing cards, cart/wishlist line items, order snapshots) read MainImagePath directly.
        private async Task SaveImagesFromJsonAsync(int productId, string? imagesJson)
        {
            if (string.IsNullOrWhiteSpace(imagesJson)) return;

            try
            {
                var existingImages = await _context.ProductImages
                    .Where(i => i.ProductId == productId && !i.IsDeleted)
                    .ToListAsync();
                foreach (var ei in existingImages)
                {
                    ei.IsDeleted = true;
                }

                var items = System.Text.Json.JsonSerializer.Deserialize<List<IncomingImageDto>>(
                    imagesJson,
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );

                string? primaryPath = null;

                if (items != null && items.Count > 0)
                {
                    // Exactly one image ends up primary: whichever the admin flagged, or index 0
                    // if none was flagged. This closes the "double primary" / "no primary" gap in
                    // UploadGalleryImage, which never enforced uniqueness.
                    var primaryIndex = items.FindIndex(i => i.IsPrimary);
                    if (primaryIndex < 0) primaryIndex = 0;

                    for (int i = 0; i < items.Count; i++)
                    {
                        var incoming = items[i];
                        var path = incoming.ImagePath;

                        if (!string.IsNullOrEmpty(path) && path.StartsWith("data:image/"))
                        {
                            path = await SaveBase64ImageAsync(path);
                        }

                        if (string.IsNullOrEmpty(path)) continue;

                        var isPrimary = i == primaryIndex;
                        if (isPrimary) primaryPath = path;

                        var pi = new ProductImage
                        {
                            ProductId = productId,
                            ImagePath = path,
                            DisplayOrder = i,
                            IsPrimary = isPrimary,
                            IsActive = true,
                            IsDeleted = false,
                            CreatedDate = DateTime.Now
                        };
                        await _context.ProductImages.AddAsync(pi);
                    }
                }

                if (!string.IsNullOrEmpty(primaryPath))
                {
                    var product = await _context.Products.FindAsync(productId);
                    if (product != null)
                    {
                        product.MainImagePath = primaryPath;
                    }
                }

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving images from JSON: {ex.Message}");
            }
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _productRepository.DeleteAsync(id);
            if (!success)
            {
                return NotFound(new { message = $"Product with Id {id} not found." });
            }

            return NoContent();
        }

        [Authorize]
        [HttpPost("{id}/variant")]
        public async Task<IActionResult> AddVariant(int id, [FromBody] ProductVariant variant)
        {
            variant.ProductId = id;
            var success = await _productRepository.AddVariantAsync(variant);
            if (!success)
            {
                return BadRequest(new { message = "Failed to add product variant." });
            }
            return Ok(variant);
        }

        [Authorize]
        [HttpDelete("variant/{variantId}")]
        public async Task<IActionResult> DeleteVariant(int variantId)
        {
            var success = await _productRepository.DeleteVariantAsync(variantId);
            if (!success)
            {
                return NotFound(new { message = $"Variant with Id {variantId} not found." });
            }
            return NoContent();
        }

        [Authorize]
        [HttpPost("{id}/images")]
        public async Task<IActionResult> UploadGalleryImage(int id, IFormFile imageFile, [FromQuery] bool isPrimary = false)
        {
            if (imageFile == null || imageFile.Length == 0)
            {
                return BadRequest(new { message = "No image file provided." });
            }

            if (imageFile.Length > MaxFileSizeBytes)
            {
                return BadRequest(new { message = $"Image size ({imageFile.Length / (1024.0 * 1024.0):F2} MB) exceeds maximum allowed limit of 2 MB." });
            }

            var existingImages = await _context.ProductImages
                .Where(i => i.ProductId == id && !i.IsDeleted)
                .ToListAsync();

            if (isPrimary)
            {
                // Enforce single-primary invariant — previously nothing prevented two images
                // from both ending up IsPrimary = true.
                foreach (var ei in existingImages)
                {
                    ei.IsPrimary = false;
                }
                await _context.SaveChangesAsync();
            }

            var nextDisplayOrder = existingImages.Count > 0 ? existingImages.Max(i => i.DisplayOrder) + 1 : 0;

            var imagePath = await SaveImageAsync(imageFile);
            var productImage = new ProductImage
            {
                ProductId = id,
                ImagePath = imagePath,
                IsPrimary = isPrimary,
                DisplayOrder = nextDisplayOrder
            };

            var success = await _productRepository.AddImageAsync(productImage);
            if (!success)
            {
                return BadRequest(new { message = "Failed to save product image." });
            }

            if (isPrimary)
            {
                var product = await _context.Products.FindAsync(id);
                if (product != null)
                {
                    product.MainImagePath = imagePath;
                    await _context.SaveChangesAsync();
                }
            }

            return Ok(productImage);
        }

        [Authorize]
        [HttpDelete("image/{imageId}")]
        public async Task<IActionResult> DeleteImage(int imageId)
        {
            var success = await _productRepository.DeleteImageAsync(imageId);
            if (!success)
            {
                return NotFound(new { message = $"Image with Id {imageId} not found." });
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

            var uploadDir = Path.Combine(webRoot, "uploads", "product");
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

            return $"/uploads/product/{fileName}";
        }

        private async Task<string> SaveBase64ImageAsync(string base64String)
        {
            var webRoot = _environment.WebRootPath;
            if (string.IsNullOrEmpty(webRoot))
            {
                webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }

            var uploadDir = Path.Combine(webRoot, "uploads", "product");
            if (!Directory.Exists(uploadDir))
            {
                Directory.CreateDirectory(uploadDir);
            }

            var parts = base64String.Split(',');
            var header = parts[0];
            var data = parts.Length > 1 ? parts[1] : parts[0];

            string ext = ".png";
            if (header.Contains("image/jpeg") || header.Contains("image/jpg")) ext = ".jpg";
            else if (header.Contains("image/webp")) ext = ".webp";
            else if (header.Contains("image/gif")) ext = ".gif";

            var bytes = Convert.FromBase64String(data);
            var fileName = $"{Guid.NewGuid()}{ext}";
            var filePath = Path.Combine(uploadDir, fileName);

            await System.IO.File.WriteAllBytesAsync(filePath, bytes);
            return $"/uploads/product/{fileName}";
        }
    }
}
