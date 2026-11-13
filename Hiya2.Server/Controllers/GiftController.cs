using System.Security.Claims;
using HIyaghar.Infra;
using Hiya2.Server.Models;
using Hiya2.Server.Repositories.Cart;
using Hiya2.Server.Services;
using Hiya2.Server.Services.Gifting;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hiya2.Server.Controllers
{
    public class GiftQuoteRequestDto
    {
        public List<GiftQuoteItem> Items { get; set; } = new();
    }

    public class GiftCheckoutQuoteRequestDto
    {
        /// <summary>Set for a Buy Now checkout; otherwise the customer's server cart is quoted.</summary>
        public BuyNowItem? BuyNowItem { get; set; }
        /// <summary>Set for a gift of only the builder's items (the cart is not included).</summary>
        public List<BuyNowItem>? BuyNowItems { get; set; }
    }

    public class GiftBoxDto
    {
        public int? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }

    /// <summary>
    /// Gifting: box quotes, the personalised photo upload, gift box settings and the staff-only
    /// downloads of each order's photo and A4 print insert. Prices are always worked out here,
    /// never taken from the browser.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class GiftController : ControllerBase
    {
        private readonly IGiftService _giftService;
        private readonly IOrderService _orderService;
        private readonly GiftStorage _storage;
        private readonly DataContext _context;

        public GiftController(IGiftService giftService, IOrderService orderService, GiftStorage storage, DataContext context)
        {
            _giftService = giftService;
            _orderService = orderService;
            _storage = storage;
            _context = context;
        }

        private long GetCurrentCustomerId()
        {
            var claimSub = User.FindFirstValue("CustomerId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            return long.TryParse(claimSub, out var id) ? id : 0;
        }

        private bool IsStaff() => User.FindFirstValue("token_type") == "staff";
        private bool IsCustomer() => User.FindFirstValue("token_type") == "customer";

        private static object QuoteDto(GiftBoxPlan plan) => new
        {
            isSuccess = plan.IsSuccess,
            message = plan.Error,
            boxCount = plan.BoxCount,
            boxSummary = plan.IsSuccess ? plan.Summary : null,
            boxes = plan.Boxes.Select(b => new { b.BoxId, b.Name, b.Capacity, b.UsedUnits }),
            chargePerBox = GiftSettings.PersonalisationChargePerBox,
            normalCharge = 0m,
            personalisedCharge = plan.IsSuccess ? GiftSettings.PersonalisationChargePerBox * plan.BoxCount : 0m,
        };

        /// <summary>Settings the gift pages need (charge per box, photo size limit).</summary>
        [HttpGet("options")]
        public IActionResult GetOptions() => Ok(new
        {
            isSuccess = true,
            chargePerBox = GiftSettings.PersonalisationChargePerBox,
            maxPhotoMb = GiftSettings.MaxPhotoBytes / (1024 * 1024),
            maxMessageChars = GiftSettings.MaxMessageChars,
        });

        /// <summary>Box choice + charges for products picked in the gift builder (no login needed).</summary>
        [HttpPost("quote")]
        public async Task<IActionResult> Quote([FromBody] GiftQuoteRequestDto dto)
        {
            if (dto.Items == null || dto.Items.Count == 0 || dto.Items.Count > 100)
            {
                return BadRequest(new { isSuccess = false, message = "Please select at least one product for your gift." });
            }
            var (plan, _) = await _giftService.PlanItemsAsync(dto.Items);
            return Ok(QuoteDto(plan));
        }

        /// <summary>Box choice + charges for what the customer is checking out (server cart or Buy Now item).</summary>
        [Authorize]
        [HttpPost("quote/checkout")]
        public async Task<IActionResult> QuoteCheckout([FromBody] GiftCheckoutQuoteRequestDto dto)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0) return Unauthorized();

            var lines = await _orderService.LoadCheckoutLinesAsync(customerId, dto.BuyNowItem, dto.BuyNowItems);
            if (lines.Error != null)
            {
                return Ok(new { isSuccess = false, message = lines.Error });
            }
            return Ok(QuoteDto(await _giftService.PlanLinesAsync(lines.Lines)));
        }

        /// <summary>
        /// Uploads the personalised gift photo: the original file plus the cropped version made in
        /// the browser. Both are checked by content (JPG / PNG / WebP only, max 10 MB) and stored privately.
        /// </summary>
        [Authorize]
        [HttpPost("photo")]
        [RequestSizeLimit(2 * GiftSettings.MaxPhotoBytes + 1024 * 1024)]
        public async Task<IActionResult> UploadPhoto(IFormFile? original, IFormFile? cropped)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0 || !IsCustomer()) return Unauthorized();

            if (original == null || cropped == null)
            {
                return BadRequest(new { isSuccess = false, message = "Please choose a photo to upload." });
            }

            var (originalBytes, originalKind, originalError) = await ReadImageAsync(original);
            if (originalError != null) return BadRequest(new { isSuccess = false, message = originalError });
            var (croppedBytes, croppedKind, croppedError) = await ReadImageAsync(cropped);
            if (croppedError != null) return BadRequest(new { isSuccess = false, message = croppedError });

            var token = await _storage.SavePendingPhotoAsync(customerId, originalBytes!, originalKind!.Value, croppedBytes!, croppedKind!.Value);
            return Ok(new { isSuccess = true, photoToken = token });
        }

        /// <summary>The customer's own uploaded (cropped) photo, so a gift can be reopened after a page reload.</summary>
        [Authorize]
        [HttpGet("photo/{token}")]
        public IActionResult GetPhoto(string token)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0 || !IsCustomer()) return Unauthorized();

            var photo = _storage.FindPendingPhoto(customerId, token);
            if (photo == null) return NotFound(new { isSuccess = false, message = "Photo not found. Please upload it again." });

            Response.Headers.CacheControl = "private, no-store";
            return PhysicalFile(photo.Value.Cropped, GiftStorage.ContentType(photo.Value.Cropped));
        }

        /// <summary>
        /// The customer's own A4 gift insert PDF (Personalised gifts with a photo or message).
        /// Only the customer who placed the order can download it.
        /// </summary>
        [Authorize]
        [HttpGet("my-orders/{orderNumber}/insert")]
        public async Task<IActionResult> DownloadMyInsert(string orderNumber)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0 || !IsCustomer()) return Unauthorized();

            var order = await _context.Orders.AsNoTracking()
                .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber && o.CustomerId == customerId && !o.IsDeleted);
            if (order == null) return NotFound(new { isSuccess = false, message = "Order not found." });

            string? path;
            try
            {
                path = await _giftService.EnsureInsertPdfAsync(order.Id);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GIFT PDF ERROR] Order {order.OrderNumber}: {ex}");
                return StatusCode(500, new { isSuccess = false, message = "Your gift insert could not be prepared. Please try again later." });
            }
            if (path == null) return NotFound(new { isSuccess = false, message = "This order has no personalised gift insert." });

            Response.Headers.CacheControl = "private, no-store";
            return PhysicalFile(path, "application/pdf", $"{order.OrderNumber}-gift-insert-A4.pdf");
        }

        // --- Gift boxes ---

        [HttpGet("boxes")]
        public async Task<IActionResult> GetBoxes()
        {
            var boxes = await _context.GiftBoxes
                .Where(b => !b.IsDeleted && b.IsActive)
                .OrderBy(b => b.Capacity)
                .Select(b => new { b.Id, b.Name, b.Capacity })
                .ToListAsync();
            return Ok(new { isSuccess = true, boxes });
        }

        [Authorize]
        [HttpGet("admin/boxes")]
        public async Task<IActionResult> GetBoxesAdmin()
        {
            if (!IsStaff()) return Forbid();
            var boxes = await _context.GiftBoxes
                .Where(b => !b.IsDeleted)
                .OrderBy(b => b.DisplayOrder).ThenBy(b => b.Capacity)
                .Select(b => new { b.Id, b.Name, b.Capacity, b.DisplayOrder, b.IsActive })
                .ToListAsync();
            return Ok(new { isSuccess = true, boxes });
        }

        /// <summary>Saves the full list of gift boxes; boxes left out are removed.</summary>
        [Authorize]
        [HttpPut("admin/boxes")]
        public async Task<IActionResult> SaveBoxesAdmin([FromBody] List<GiftBoxDto> boxes)
        {
            if (!IsStaff()) return Forbid();

            boxes ??= new List<GiftBoxDto>();
            foreach (var b in boxes)
            {
                b.Name = (b.Name ?? string.Empty).Trim();
                if (b.Name.Length == 0 || b.Name.Length > 100)
                    return BadRequest(new { isSuccess = false, message = "Every box needs a name (up to 100 characters)." });
                if (b.Capacity < 1 || b.Capacity > 100)
                    return BadRequest(new { isSuccess = false, message = $"'{b.Name}': capacity must be between 1 and 100 units." });
            }
            if (!boxes.Any(b => b.IsActive))
                return BadRequest(new { isSuccess = false, message = "Keep at least one gift box active, or gift orders cannot be packed." });

            var existing = await _context.GiftBoxes.Where(b => !b.IsDeleted).ToListAsync();
            var keepIds = boxes.Where(b => b.Id.HasValue).Select(b => b.Id!.Value).ToHashSet();
            foreach (var box in existing.Where(e => !keepIds.Contains(e.Id)))
            {
                box.IsDeleted = true;
                box.IsActive = false;
                box.LastModifiedDate = DateTime.Now;
            }

            foreach (var dto in boxes)
            {
                var box = dto.Id.HasValue ? existing.FirstOrDefault(e => e.Id == dto.Id.Value) : null;
                if (box == null)
                {
                    box = new GiftBox { CreatedDate = DateTime.Now };
                    await _context.GiftBoxes.AddAsync(box);
                }
                box.Name = dto.Name;
                box.Capacity = dto.Capacity;
                box.DisplayOrder = dto.DisplayOrder;
                box.IsActive = dto.IsActive;
                box.LastModifiedDate = DateTime.Now;
            }

            await _context.SaveChangesAsync();
            return Ok(new { isSuccess = true, message = "Gift boxes saved." });
        }

        // --- Order gift files (staff only) ---

        [Authorize]
        [HttpGet("admin/orders/{orderId:long}")]
        public async Task<IActionResult> GetOrderGiftAdmin(long orderId)
        {
            if (!IsStaff()) return Forbid();

            var gift = await _context.OrderGifts.AsNoTracking().FirstOrDefaultAsync(g => g.OrderId == orderId);
            if (gift == null) return NotFound(new { isSuccess = false, message = "This order is not a gift." });

            return Ok(new
            {
                isSuccess = true,
                gift = new
                {
                    gift.GiftType,
                    gift.BoxCount,
                    gift.BoxSummary,
                    gift.BoxesJson,
                    gift.ChargePerBox,
                    gift.TotalCharge,
                    gift.IsForSelf,
                    gift.RecipientName,
                    gift.RecipientPhone,
                    gift.MessageJson,
                    gift.MessageText,
                    hasPhoto = _storage.Resolve(gift.PhotoPath) != null,
                    hasOriginalPhoto = _storage.Resolve(gift.PhotoOriginalPath) != null,
                    needsInsert = gift.GiftType == GiftTypes.Personalised && (gift.PhotoPath != null || gift.MessageJson != null),
                    hasInsert = _storage.Resolve(gift.InsertPdfPath) != null,
                },
            });
        }

        [Authorize]
        [HttpGet("admin/orders/{orderId:long}/photo")]
        public async Task<IActionResult> DownloadPhotoAdmin(long orderId, [FromQuery] bool original = false)
        {
            if (!IsStaff()) return Forbid();

            var gift = await _context.OrderGifts.Include(g => g.Order).AsNoTracking().FirstOrDefaultAsync(g => g.OrderId == orderId);
            var path = _storage.Resolve(original ? gift?.PhotoOriginalPath : gift?.PhotoPath);
            if (gift == null || path == null) return NotFound(new { isSuccess = false, message = "No photo for this order." });

            Response.Headers.CacheControl = "private, no-store";
            var name = $"{gift.Order?.OrderNumber}-photo{(original ? "-original" : "")}{Path.GetExtension(path)}";
            return PhysicalFile(path, GiftStorage.ContentType(path), name);
        }

        /// <summary>The A4 print insert PDF; built now if it is missing (or when regenerate=true).</summary>
        [Authorize]
        [HttpGet("admin/orders/{orderId:long}/insert")]
        public async Task<IActionResult> DownloadInsertAdmin(long orderId, [FromQuery] bool regenerate = false)
        {
            if (!IsStaff()) return Forbid();

            var gift = await _context.OrderGifts.Include(g => g.Order).AsNoTracking().FirstOrDefaultAsync(g => g.OrderId == orderId);
            if (gift == null) return NotFound(new { isSuccess = false, message = "This order is not a gift." });

            string? path;
            try
            {
                path = await _giftService.EnsureInsertPdfAsync(orderId, regenerate);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GIFT PDF ERROR] Order {orderId}: {ex}");
                return StatusCode(500, new { isSuccess = false, message = "The print file could not be created. Please try again or contact the developer." });
            }
            if (path == null) return NotFound(new { isSuccess = false, message = "This gift has no photo or message to print." });

            Response.Headers.CacheControl = "private, no-store";
            return PhysicalFile(path, "application/pdf", $"{gift.Order?.OrderNumber}-gift-insert-A4.pdf");
        }

        private static async Task<(byte[]? Bytes, GiftImageKind? Kind, string? Error)> ReadImageAsync(IFormFile file)
        {
            if (file.Length <= 0) return (null, null, "The photo file is empty.");
            if (file.Length > GiftSettings.MaxPhotoBytes)
            {
                return (null, null, $"The photo is too large. Please choose one under {GiftSettings.MaxPhotoBytes / (1024 * 1024)} MB.");
            }

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            var bytes = ms.ToArray();
            var kind = GiftStorage.DetectImage(bytes);
            return kind == null
                ? (null, null, "Please upload a JPG, JPEG, PNG or WebP image.")
                : (bytes, kind, null);
        }
    }
}
