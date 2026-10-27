using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
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
        // null = leave this variant's images untouched; empty list = remove them all.
        public List<IncomingImageDto>? Images { get; set; }
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
        private readonly IOutputCacheStore _outputCacheStore;

        public ProductController(IProductRepository productRepository, IWebHostEnvironment environment, DataContext context, IOutputCacheStore outputCacheStore)
        {
            _productRepository = productRepository;
            _environment = environment;
            _context = context;
            _outputCacheStore = outputCacheStore;
        }

        // The storefront product list is output-cached ("CatalogCache"); drop it after any admin change
        // so a deactivated product disappears right away instead of after the cache expires.
        // Runs after the save is committed, so a failure here must not turn into an error response.
        private async Task EvictCatalogCacheAsync()
        {
            try
            {
                await _outputCacheStore.EvictByTagAsync("catalog", default);
            }
            catch (Exception ex)
            {
                HttpContext.RequestServices.GetRequiredService<ILogger<ProductController>>()
                    .LogWarning(ex, "Catalog cache eviction failed; it will expire on its own.");
            }
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(claim, out var id) ? id : 0;
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string? q)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(q))
                {
                    return Ok(new List<object>());
                }

                var term = q.Trim().ToLower();
                var products = await _productRepository.GetAllAsync(null, null, true);
                var matched = products
                    .Where(p => (p.ProductName != null && p.ProductName.ToLower().Contains(term))
                             || (p.ShortDescription != null && p.ShortDescription.ToLower().Contains(term))
                             || (p.Category != null && p.Category.CategoryName != null && p.Category.CategoryName.ToLower().Contains(term)))
                    .Take(10)
                    .Select(p => new
                    {
                        id = p.Id,
                        productName = p.ProductName,
                        categoryId = p.CategoryId,
                        categoryName = p.Category != null ? p.Category.CategoryName : "General",
                        shortDescription = p.ShortDescription,
                        mainImagePath = p.MainImagePath,
                        basePrice = p.BasePrice,
                        discountPrice = p.DiscountPrice,
                        rating = p.Rating
                    });

                return Ok(matched);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Search failed: {ex.Message}" });
            }
        }

        [HttpGet]
        [Microsoft.AspNetCore.OutputCaching.OutputCache(PolicyName = "CatalogCache")]
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
                    variants = p.Variants.Where(v => !v.IsDeleted).Select(v => BuildVariantResponse(v, p.Images)),
                    images = p.Images.Where(i => !i.IsDeleted && i.VariantId == null)
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

        private static object BuildVariantResponse(ProductVariant v, IEnumerable<ProductImage> productImages)
        {
            var attrs = ParseVariantAttributes(v);
            var first = attrs.Count > 0 ? attrs[0] : new AttributeNameValueDto { AttributeName = "Weight", AttributeValue = v.VariantName };
            var images = productImages
                .Where(i => !i.IsDeleted && i.VariantId == v.Id)
                .OrderByDescending(i => i.IsPrimary).ThenBy(i => i.DisplayOrder)
                .ToList();
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
                isDefault = v.IsDefault,
                primaryImage = images.FirstOrDefault()?.ImagePath,
                images = images.Select(i => new
                {
                    id = i.Id,
                    imagePath = i.ImagePath,
                    isPrimary = i.IsPrimary,
                    displayOrder = i.DisplayOrder
                })
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
                variants = p.Variants.Where(v => !v.IsDeleted).Select(v => BuildVariantResponse(v, p.Images)),
                images = p.Images.Where(i => !i.IsDeleted && i.VariantId == null)
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
        private const int MaxImagesPerVariant = 6;

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

                // Product, variants and gallery are saved all-or-nothing: if any part fails the
                // whole save rolls back and the admin sees the real error instead of a false success.
                await using var transaction = await _context.Database.BeginTransactionAsync();

                var created = await _productRepository.AddAsync(product);

                // Save variants if provided
                await SaveVariantsFromJsonAsync(created.Id, variantsJson);

                // Save the full gallery (with primary flag) if provided — replaces the
                // single-mainImage-only handling above with the authoritative image list.
                await SaveImagesFromJsonAsync(created.Id, imagesJson);

                await SyncMainImagePathAsync(created.Id);

                await transaction.CommitAsync();
                await EvictCatalogCacheAsync();

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

                // All-or-nothing, same as Create.
                await using var transaction = await _context.Database.BeginTransactionAsync();

                var success = await _productRepository.UpdateAsync(product);
                if (!success)
                {
                    return NotFound(new { message = $"Product with Id {id} not found." });
                }

                // Update variants if provided
                await SaveVariantsFromJsonAsync(id, variantsJson);

                // Update the full gallery (with primary flag) if provided.
                await SaveImagesFromJsonAsync(id, imagesJson);

                await SyncMainImagePathAsync(id);

                await transaction.CommitAsync();
                await EvictCatalogCacheAsync();

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

            var existingVars = await _context.ProductVariants
                .Where(v => v.ProductId == productId && !v.IsDeleted)
                .ToListAsync();

            var items = System.Text.Json.JsonSerializer.Deserialize<List<IncomingVariantDto>>(
                variantsJson,
                new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            ) ?? new List<IncomingVariantDto>();

            // Exactly one variant ends up default: the first one the admin flagged, or the
            // first row if none was flagged. Listing cards and bundles rely on a single default.
            if (items.Count > 0)
            {
                var defaultIndex = items.FindIndex(i => i.IsDefault);
                if (defaultIndex < 0) defaultIndex = 0;
                for (int i = 0; i < items.Count; i++)
                {
                    items[i].IsDefault = i == defaultIndex;
                }
            }

            // Variants are updated in place (matched by Id) so their Id stays stable. Cart
            // items, wishlist entries, stock reservations and stock history all point at
            // VariantId, so recreating rows on every save would orphan them. Stock is never
            // touched here - it's managed exclusively from the Stock Management page.
            // Rows sent without an Id (older clients) fall back to matching by SKU.
            var unmatched = existingVars.ToList();
            var now = DateTime.Now;
            var imageUpdates = new List<(ProductVariant Variant, List<IncomingImageDto> Images)>();

            foreach (var v in items)
            {
                if (v.Images != null && v.Images.Count(i => !string.IsNullOrEmpty(i.ImagePath)) > MaxImagesPerVariant)
                {
                    throw new InvalidOperationException($"A variant can have at most {MaxImagesPerVariant} images.");
                }

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

                var sku = !string.IsNullOrWhiteSpace(v.Sku) ? v.Sku.Trim() : $"SKU-{Guid.NewGuid().ToString().Substring(0, 5)}";
                var price = v.Price > 0 ? v.Price : 149;
                var originalPrice = v.OriginalPrice > 0 ? v.OriginalPrice : (v.Price > 0 ? v.Price : 199);

                var match = v.Id > 0 ? unmatched.FirstOrDefault(ev => ev.Id == v.Id) : null;
                if (match == null && v.Id <= 0 && !string.IsNullOrWhiteSpace(v.Sku))
                {
                    match = unmatched.FirstOrDefault(ev =>
                        string.Equals(ev.SKU?.Trim(), sku, StringComparison.OrdinalIgnoreCase));
                }

                if (match != null)
                {
                    unmatched.Remove(match);
                    match.VariantName = comboName;
                    match.SKU = sku;
                    match.Price = price;
                    match.OriginalPrice = originalPrice;
                    match.IsDefault = v.IsDefault;
                    match.IsActive = true;
                    match.LastModifiedDate = now;
                    if (v.Images != null) imageUpdates.Add((match, v.Images));
                    continue;
                }

                var created = new ProductVariant
                {
                    ProductId = productId,
                    VariantName = comboName,
                    SKU = sku,
                    Price = price,
                    OriginalPrice = originalPrice,
                    IsDefault = v.IsDefault,
                    IsActive = true,
                    IsDeleted = false,
                    CreatedDate = now
                };
                await _context.ProductVariants.AddAsync(created);
                if (v.Images != null) imageUpdates.Add((created, v.Images));
            }

            // Whatever wasn't matched was removed by the admin. Soft-delete it and clear
            // the cart lines, wishlist entries and live reservations that still point at it,
            // so nobody can keep checking out a variant that no longer exists.
            if (unmatched.Count > 0)
            {
                var removedIds = unmatched.Select(ev => ev.Id).ToList();
                foreach (var ev in unmatched)
                {
                    ev.IsDeleted = true;
                    ev.IsActive = false;
                    ev.LastModifiedDate = now;
                }

                var orphanCartItems = await _context.CartItems
                    .Where(c => c.VariantId.HasValue && removedIds.Contains(c.VariantId.Value) && !c.IsDeleted)
                    .ToListAsync();
                foreach (var c in orphanCartItems)
                {
                    c.IsDeleted = true;
                    c.IsActive = false;
                    c.LastModifiedDate = now;
                }

                var orphanWishlist = await _context.WishlistCustomers
                    .Where(w => w.VariantId.HasValue && removedIds.Contains(w.VariantId.Value) && !w.IsDeleted)
                    .ToListAsync();
                foreach (var w in orphanWishlist)
                {
                    w.IsDeleted = true;
                    w.IsActive = false;
                    w.LastModifiedDate = now;
                }

                var orphanReservations = await _context.StockReservations
                    .Where(r => removedIds.Contains(r.VariantId) && r.Status == StockReservationStatus.Reserved)
                    .ToListAsync();
                foreach (var r in orphanReservations)
                {
                    r.Status = StockReservationStatus.Released;
                    r.ReleasedAt = now;
                    r.LastModifiedDate = now;
                }

                var orphanImages = await _context.ProductImages
                    .Where(i => i.VariantId.HasValue && removedIds.Contains(i.VariantId.Value) && !i.IsDeleted)
                    .ToListAsync();
                foreach (var i in orphanImages)
                {
                    i.IsDeleted = true;
                }
            }

            // Save first so newly added variants get their Id before their images point at it.
            await _context.SaveChangesAsync();

            foreach (var (variant, images) in imageUpdates)
            {
                await SaveVariantImagesAsync(productId, variant.Id, images);
            }
            await _context.SaveChangesAsync();
        }

        // Full-replace of one variant's own gallery, same pattern as SaveImagesFromJsonAsync:
        // soft-delete its existing rows, reinsert from the list (array order = DisplayOrder),
        // and make exactly one primary - the one the admin flagged, or the first.
        private async Task SaveVariantImagesAsync(int productId, int variantId, List<IncomingImageDto> images)
        {
            var existing = await _context.ProductImages
                .Where(i => i.VariantId == variantId && !i.IsDeleted)
                .ToListAsync();
            foreach (var ei in existing)
            {
                ei.IsDeleted = true;
            }

            var primaryIndex = images.FindIndex(i => i.IsPrimary);
            if (primaryIndex < 0) primaryIndex = 0;

            for (int i = 0; i < images.Count; i++)
            {
                var path = images[i].ImagePath;
                if (!string.IsNullOrEmpty(path) && path.StartsWith("data:image/"))
                {
                    path = await SaveBase64ImageAsync(path);
                }
                if (string.IsNullOrEmpty(path)) continue;

                await _context.ProductImages.AddAsync(new ProductImage
                {
                    ProductId = productId,
                    VariantId = variantId,
                    ImagePath = path,
                    DisplayOrder = i,
                    IsPrimary = i == primaryIndex,
                    IsActive = true,
                    IsDeleted = false,
                    CreatedDate = DateTime.Now
                });
            }
        }

        // Product.MainImagePath is what listing cards, cart/wishlist fallbacks, gift hampers and
        // SEO read, so keep it pointing at the image a shopper sees first: the default variant's
        // primary image, else the primary common image, else another variant's primary image.
        // Left unchanged if the product has no images at all.
        private async Task SyncMainImagePathAsync(int productId)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return;

            var defaultVariantId = await _context.ProductVariants
                .Where(v => v.ProductId == productId && !v.IsDeleted)
                .OrderByDescending(v => v.IsDefault).ThenBy(v => v.Id)
                .Select(v => (int?)v.Id)
                .FirstOrDefaultAsync();

            var images = await _context.ProductImages
                .Where(i => i.ProductId == productId && !i.IsDeleted)
                .ToListAsync();

            var path = images
                .Where(i => defaultVariantId.HasValue && i.VariantId == defaultVariantId)
                .OrderByDescending(i => i.IsPrimary).ThenBy(i => i.DisplayOrder)
                .Select(i => i.ImagePath)
                .FirstOrDefault()
                ?? images
                .Where(i => i.VariantId == null)
                .OrderByDescending(i => i.IsPrimary).ThenBy(i => i.DisplayOrder)
                .Select(i => i.ImagePath)
                .FirstOrDefault()
                ?? images
                .Where(i => i.VariantId != null)
                .OrderBy(i => i.VariantId).ThenByDescending(i => i.IsPrimary).ThenBy(i => i.DisplayOrder)
                .Select(i => i.ImagePath)
                .FirstOrDefault();

            if (!string.IsNullOrEmpty(path) && product.MainImagePath != path)
            {
                product.MainImagePath = path;
                await _context.SaveChangesAsync();
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

            // Common images only - variant galleries are saved with their variant.
            var existingImages = await _context.ProductImages
                .Where(i => i.ProductId == productId && i.VariantId == null && !i.IsDeleted)
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

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _productRepository.DeleteAsync(id);
            if (!success)
            {
                return NotFound(new { message = $"Product with Id {id} not found." });
            }

            await EvictCatalogCacheAsync();
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
            await EvictCatalogCacheAsync();
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
            await EvictCatalogCacheAsync();
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
                .Where(i => i.ProductId == id && i.VariantId == null && !i.IsDeleted)
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

            await EvictCatalogCacheAsync();
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
            await EvictCatalogCacheAsync();
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
