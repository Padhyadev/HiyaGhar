using System.Text.Json;
using System.Text.RegularExpressions;
using HIyaghar.Infra;
using Hiya2.Server.Models;
using Hiya2.Server.Repositories.Cart;
using Microsoft.EntityFrameworkCore;

namespace Hiya2.Server.Services.Gifting
{
    /// <summary>What the checkout sends about gifting. Type "None" (or no object) = a normal order.</summary>
    public class GiftRequest
    {
        public string? Type { get; set; }
        public string? PhotoToken { get; set; }
        public string? MessageJson { get; set; }
        public bool IsForSelf { get; set; } = true;
        public string? RecipientName { get; set; }
        public string? RecipientPhone { get; set; }
    }

    public class GiftQuoteItem
    {
        public int ProductId { get; set; }
        public int? VariantId { get; set; }
        public int Quantity { get; set; }
    }

    /// <summary>A validated gift, priced on the server, ready to be saved with the order.</summary>
    public class PreparedGift
    {
        public static readonly PreparedGift None = new() { Type = GiftTypes.None };

        public string Type { get; init; } = GiftTypes.None;
        public bool IsGift => Type != GiftTypes.None;
        public bool IsPersonalised => Type == GiftTypes.Personalised;
        public GiftBoxPlan Plan { get; init; } = new();
        public decimal ChargePerBox { get; init; }
        public decimal TotalCharge { get; init; }
        public GiftMessageDoc? Message { get; init; }
        public string? PhotoToken { get; init; }
        public (string Original, string Cropped)? Photo { get; init; }
        public bool IsForSelf { get; init; } = true;
        public string? RecipientName { get; init; }
        public string? RecipientPhone { get; init; }
    }

    public class GiftPrepareResult
    {
        public bool IsSuccess { get; init; }
        public string? Message { get; init; }
        public PreparedGift Gift { get; init; } = PreparedGift.None;
    }

    public interface IGiftService
    {
        Task<List<GiftBoxType>> GetActiveBoxTypesAsync();
        Task<GiftBoxPlan> PlanLinesAsync(IEnumerable<CartLine> lines);
        Task<(GiftBoxPlan Plan, List<string> Problems)> PlanItemsAsync(IEnumerable<GiftQuoteItem> items);
        Task<GiftPrepareResult> PrepareAsync(long customerId, GiftRequest? request, List<CartLine> lines);
        /// <summary>Adds the gift record (and copies the photo) for a new order. Call inside the order transaction, before SaveChanges.</summary>
        Task AttachToOrderAsync(Order order, PreparedGift gift);
        void CleanUpAfterOrder(long customerId, PreparedGift gift);
        /// <summary>Generates the A4 insert PDF if the order needs one; returns its absolute path (null if the order has no insert).</summary>
        Task<string?> EnsureInsertPdfAsync(long orderId, bool regenerate = false);
    }

    public class GiftService : IGiftService
    {
        private static readonly Regex PhoneDigits = new(@"\D", RegexOptions.Compiled);

        private readonly DataContext _context;
        private readonly GiftStorage _storage;
        private readonly string _fontDirectory;

        public GiftService(DataContext context, GiftStorage storage, IWebHostEnvironment env)
        {
            _context = context;
            _storage = storage;
            _fontDirectory = Path.Combine(env.ContentRootPath, "Assets", "GiftFonts");
        }

        public async Task<List<GiftBoxType>> GetActiveBoxTypesAsync() =>
            await _context.GiftBoxes
                .Where(b => b.IsActive && !b.IsDeleted && b.Capacity > 0)
                .OrderBy(b => b.Capacity)
                .Select(b => new GiftBoxType(b.Id, b.Name, b.Capacity))
                .ToListAsync();

        public async Task<GiftBoxPlan> PlanLinesAsync(IEnumerable<CartLine> lines)
        {
            var items = lines.Select(l => new GiftPlanItem(
                LineLabel(l.Product.ProductName, l.Variant?.VariantName),
                l.Variant?.GiftUnits ?? 1,
                l.Item.Quantity));
            return GiftBoxPlanner.Plan(items, await GetActiveBoxTypesAsync());
        }

        public async Task<(GiftBoxPlan Plan, List<string> Problems)> PlanItemsAsync(IEnumerable<GiftQuoteItem> items)
        {
            var list = items.Where(i => i.Quantity > 0).ToList();
            var problems = new List<string>();
            if (list.Count == 0)
            {
                return (new GiftBoxPlan { Error = "Please select at least one product for your gift." }, problems);
            }

            var productIds = list.Select(i => i.ProductId).Distinct().ToList();
            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id) && p.IsActive && !p.IsDeleted)
                .Include(p => p.Variants)
                .ToDictionaryAsync(p => p.Id);

            var planItems = new List<GiftPlanItem>();
            foreach (var item in list)
            {
                if (!products.TryGetValue(item.ProductId, out var product))
                {
                    problems.Add($"Product {item.ProductId} is no longer available.");
                    continue;
                }

                ProductVariant? variant = null;
                if (item.VariantId.HasValue)
                {
                    variant = product.Variants.FirstOrDefault(v => v.Id == item.VariantId.Value && v.IsActive && !v.IsDeleted);
                    if (variant == null)
                    {
                        problems.Add($"The selected size of '{product.ProductName}' is no longer available.");
                        continue;
                    }
                }
                planItems.Add(new GiftPlanItem(LineLabel(product.ProductName, variant?.VariantName), variant?.GiftUnits ?? 1, item.Quantity));
            }

            if (problems.Count > 0)
            {
                return (new GiftBoxPlan { Error = problems[0] }, problems);
            }
            return (GiftBoxPlanner.Plan(planItems, await GetActiveBoxTypesAsync()), problems);
        }

        public async Task<GiftPrepareResult> PrepareAsync(long customerId, GiftRequest? request, List<CartLine> lines)
        {
            var type = NormaliseType(request?.Type);
            if (type == null)
            {
                return Fail("Please choose a valid gifting option.");
            }
            if (type == GiftTypes.None)
            {
                return new GiftPrepareResult { IsSuccess = true, Gift = PreparedGift.None };
            }

            var plan = await PlanLinesAsync(lines);
            if (!plan.IsSuccess)
            {
                return Fail(plan.Error ?? "We could not choose a gift box for these products.");
            }

            // Recipient details are only needed when the gift goes to someone else.
            var isForSelf = request!.IsForSelf;
            string? recipientName = null;
            string? recipientPhone = null;
            if (!isForSelf)
            {
                recipientName = request.RecipientName?.Trim();
                if (string.IsNullOrEmpty(recipientName) || recipientName.Length < 2)
                {
                    return Fail("Please enter the gift recipient's name.");
                }
                if (recipientName.Length > 100)
                {
                    return Fail("Recipient name is too long.");
                }

                if (!string.IsNullOrWhiteSpace(request.RecipientPhone))
                {
                    var digits = PhoneDigits.Replace(request.RecipientPhone, "");
                    if (digits.Length == 12 && digits.StartsWith("91")) digits = digits[2..];
                    if (digits.Length != 10)
                    {
                        return Fail("Please enter a valid 10-digit mobile number for the recipient.");
                    }
                    recipientPhone = digits;
                }
            }

            GiftMessageDoc? message = null;
            (string Original, string Cropped)? photo = null;
            string? photoToken = null;
            if (type == GiftTypes.Personalised)
            {
                // Photo and message are both optional.
                var (doc, error) = GiftMessageSanitizer.Parse(request.MessageJson);
                if (error != null) return Fail(error);
                message = doc;

                if (!string.IsNullOrWhiteSpace(request.PhotoToken))
                {
                    photo = _storage.FindPendingPhoto(customerId, request.PhotoToken.Trim());
                    if (photo == null)
                    {
                        return Fail("Your gift photo has expired. Please upload it again.");
                    }
                    photoToken = request.PhotoToken.Trim();
                }
            }

            var chargePerBox = type == GiftTypes.Personalised ? GiftSettings.PersonalisationChargePerBox : 0m;
            return new GiftPrepareResult
            {
                IsSuccess = true,
                Gift = new PreparedGift
                {
                    Type = type,
                    Plan = plan,
                    ChargePerBox = chargePerBox,
                    TotalCharge = chargePerBox * plan.BoxCount,
                    Message = message,
                    Photo = photo,
                    PhotoToken = photoToken,
                    IsForSelf = isForSelf,
                    RecipientName = recipientName,
                    RecipientPhone = recipientPhone,
                },
            };
        }

        public async Task AttachToOrderAsync(Order order, PreparedGift gift)
        {
            if (!gift.IsGift) return;

            string? originalPath = null;
            string? photoPath = null;
            if (gift.Photo.HasValue)
            {
                (originalPath, photoPath) = _storage.CopyPhotoToOrder(order.OrderNumber, gift.Photo.Value);
            }

            await _context.OrderGifts.AddAsync(new OrderGift
            {
                OrderId = order.Id,
                GiftType = gift.Type,
                BoxCount = gift.Plan.BoxCount,
                BoxSummary = gift.Plan.Summary,
                BoxesJson = JsonSerializer.Serialize(gift.Plan.Boxes.Select(b => new { b.BoxId, b.Name, b.Capacity, b.UsedUnits })),
                ChargePerBox = gift.ChargePerBox,
                TotalCharge = gift.TotalCharge,
                PhotoOriginalPath = originalPath,
                PhotoPath = photoPath,
                MessageJson = gift.Message != null ? GiftMessageSanitizer.ToEditorJson(gift.Message) : null,
                MessageText = gift.Message?.PlainText is { } text && text.Length > 2000 ? text[..2000] : gift.Message?.PlainText,
                IsForSelf = gift.IsForSelf,
                RecipientName = gift.RecipientName,
                RecipientPhone = gift.RecipientPhone,
                CreatedDate = DateTime.Now,
            });
        }

        public void CleanUpAfterOrder(long customerId, PreparedGift gift)
        {
            if (gift.PhotoToken != null) _storage.DeletePending(customerId, gift.PhotoToken);
        }

        public async Task<string?> EnsureInsertPdfAsync(long orderId, bool regenerate = false)
        {
            var gift = await _context.OrderGifts.Include(g => g.Order).FirstOrDefaultAsync(g => g.OrderId == orderId);
            if (gift == null || gift.Order == null || gift.GiftType != GiftTypes.Personalised) return null;

            var existing = _storage.Resolve(gift.InsertPdfPath);
            if (existing != null && !regenerate) return existing;

            var (message, _) = GiftMessageSanitizer.Parse(gift.MessageJson);
            var photo = _storage.Resolve(gift.PhotoPath);
            if (message == null && photo == null) return null; // Personalised, but nothing to print.

            GiftInsertPdf.EnsureFonts(_fontDirectory);
            var pdf = GiftInsertPdf.Render(message, photo);
            gift.InsertPdfPath = await _storage.SaveInsertPdfAsync(gift.Order.OrderNumber, pdf);
            await _context.SaveChangesAsync();
            return _storage.Resolve(gift.InsertPdfPath);
        }

        private static string? NormaliseType(string? type)
        {
            if (string.IsNullOrWhiteSpace(type)) return GiftTypes.None;
            if (type.Equals(GiftTypes.None, StringComparison.OrdinalIgnoreCase)) return GiftTypes.None;
            if (type.Equals(GiftTypes.Normal, StringComparison.OrdinalIgnoreCase)) return GiftTypes.Normal;
            if (type.Equals(GiftTypes.Personalised, StringComparison.OrdinalIgnoreCase)
                || type.Equals("Personalized", StringComparison.OrdinalIgnoreCase)) return GiftTypes.Personalised;
            return null;
        }

        private static string LineLabel(string productName, string? variantName) =>
            string.IsNullOrWhiteSpace(variantName) ? productName : $"{productName} ({variantName})";

        private static GiftPrepareResult Fail(string message) => new() { IsSuccess = false, Message = message };
    }
}
