using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;

namespace Hiya2.Server.Controllers
{
    public class LovCreateDto
    {
        public string LovColumn { get; set; } = string.Empty;
        public string LovCode { get; set; } = string.Empty;
        public string LovDesc { get; set; } = string.Empty;
        public int DisplayOrder { get; set; } = 0;

        // Only used the first time a code is created under a brand-new
        // LovColumn - becomes that category's LovCategory.DisplayText.
        // Ignored if the category already exists.
        public string? CategoryDisplayText { get; set; }
    }

    public class LovCategoryUpdateDto
    {
        // LovColumn is intentionally not here - it's the stable key, fixed
        // once created. Only the friendly display text can be renamed.
        public string DisplayText { get; set; } = string.Empty;
    }

    public class LovUpdateDto
    {
        // LovColumn/LovCode are intentionally not here - once a code exists,
        // app code depends on it staying fixed. Only the display text (and
        // its ordering/active flag) is editable, which is the whole point of
        // this table: rename a label with zero code changes.
        public string LovDesc { get; set; } = string.Empty;
        public int DisplayOrder { get; set; } = 0;
        public bool IsActive { get; set; } = true;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class LovController : ControllerBase
    {
        private readonly DataContext _context;

        public LovController(DataContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Public read used anywhere in the app (admin or customer-facing)
        /// that needs to resolve a code to its current display text - e.g.
        /// order status labels in emails, the admin order list, and the
        /// customer order-tracking timeline.
        /// </summary>
        [AllowAnonymous]
        [HttpGet("public")]
        public async Task<IActionResult> GetPublic([FromQuery] string column)
        {
            if (string.IsNullOrWhiteSpace(column))
            {
                return BadRequest(new { isSuccess = false, message = "column is required." });
            }

            var rows = await _context.LovMasters
                .Where(l => l.LovColumn == column && l.IsActive && !l.IsDeleted)
                .OrderBy(l => l.DisplayOrder)
                .Select(l => new { code = l.LovCode, desc = l.LovDesc })
                .ToListAsync();

            return Ok(new { isSuccess = true, items = rows });
        }

        [Authorize]
        [HttpGet("columns")]
        public async Task<IActionResult> GetColumns()
        {
            var defaultCategories = new (string col, string text, (string code, string desc, int order)[] items)[]
            {
                ("OrderStatus", "Order Status", new[] {
                    ("Placed", "Placed", 1), ("Confirmed", "Confirmed", 2), ("Processing", "Processing", 3),
                    ("Packed", "Packed", 4), ("Shipped", "Shipped", 5), ("OutForDelivery", "Out for Delivery", 6),
                    ("Delivered", "Delivered", 7), ("CancelRequested", "Cancellation Requested", 8),
                    ("Cancelled", "Cancelled", 9), ("ReturnRequested", "Return Requested", 10),
                    ("Returned", "Returned", 11), ("RefundInitiated", "Refund Initiated", 12),
                    ("Refunded", "Refunded", 13), ("CancelRejected", "Cancellation Rejected", 14)
                }),
                ("PaymentMode", "Payment Mode", new[] {
                    ("COD", "Cash on Delivery (COD)", 1),
                    ("ONLINE", "Online Payment / UPI / NetBanking", 2),
                    ("WALLET", "Digital Wallet", 3)
                }),
                ("PaymentStatus", "Payment Status", new[] {
                    ("Pending", "Pending", 1), ("Paid", "Paid", 2),
                    ("Failed", "Failed", 3), ("Refunded", "Refunded", 4)
                }),
                ("DiscountType", "Coupon Discount Type", new[] {
                    ("Percentage", "Percentage (%)", 1),
                    ("Flat", "Flat Amount (₹)", 2)
                }),
                ("Gender", "Gender Options", new[] {
                    ("Male", "Male", 1), ("Female", "Female", 2), ("Other", "Other", 3)
                }),
                ("AddressType", "Address Type", new[] {
                    ("Home", "Home", 1), ("Work", "Work / Office", 2), ("Other", "Other", 3)
                }),
                ("CourierPartner", "Courier Delivery Partners", new[] {
                    ("DTDC", "DTDC Express", 1), ("DELHIVERY", "Delhivery", 2),
                    ("BLUEDART", "Blue Dart", 3), ("EKART", "Ekart Logistics", 4),
                    ("SPEEDPOST", "India Post (Speed Post)", 5), ("SHADOWFAX", "Shadowfax", 6),
                    ("XPRESSBEES", "Xpressbees", 7), ("LOCAL", "Self Pickup / Local Delivery", 8)
                }),
                ("ProductSort", "Product Sorting Options", new[] {
                    ("featured", "Featured / Recommended", 1),
                    ("price-low", "Price: Low to High", 2),
                    ("price-high", "Price: High to Low", 3),
                    ("rating", "Customer Rating", 4),
                    ("newest", "Newest Arrivals", 5)
                })
            };

            bool changed = false;
            foreach (var cat in defaultCategories)
            {
                var existingCat = await _context.LovCategories.FirstOrDefaultAsync(c => c.LovColumn == cat.col);
                if (existingCat == null)
                {
                    await _context.LovCategories.AddAsync(new LovCategory
                    {
                        LovColumn = cat.col,
                        DisplayText = cat.text,
                        IsActive = true,
                        IsDeleted = false,
                        CreatedDate = DateTime.Now
                    });
                    changed = true;
                }

                foreach (var itm in cat.items)
                {
                    var existingItem = await _context.LovMasters.FirstOrDefaultAsync(l => l.LovColumn == cat.col && l.LovCode == itm.code);
                    if (existingItem == null)
                    {
                        await _context.LovMasters.AddAsync(new LovMaster
                        {
                            LovColumn = cat.col,
                            LovCode = itm.code,
                            LovDesc = itm.desc,
                            DisplayOrder = itm.order,
                            IsActive = true,
                            IsDeleted = false,
                            CreatedDate = DateTime.Now
                        });
                        changed = true;
                    }
                }
            }

            if (changed)
            {
                await _context.SaveChangesAsync();
            }

            var categories = await _context.LovCategories
                .Where(c => !c.IsDeleted)
                .OrderBy(c => c.LovColumn)
                .ToListAsync();

            return Ok(new { isSuccess = true, categories });
        }

        [Authorize]
        [HttpPut("category/{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] LovCategoryUpdateDto dto)
        {
            var category = await _context.LovCategories.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
            if (category == null)
            {
                return NotFound(new { isSuccess = false, message = "Category not found." });
            }

            if (string.IsNullOrWhiteSpace(dto.DisplayText))
            {
                return BadRequest(new { isSuccess = false, message = "Display Text is required." });
            }

            category.DisplayText = dto.DisplayText.Trim();
            category.LastModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(new { isSuccess = true, item = category });
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? column)
        {
            var query = _context.LovMasters.Where(l => !l.IsDeleted);
            if (!string.IsNullOrWhiteSpace(column))
            {
                query = query.Where(l => l.LovColumn == column);
            }

            var rows = await query.OrderBy(l => l.LovColumn).ThenBy(l => l.DisplayOrder).ToListAsync();
            return Ok(new { isSuccess = true, items = rows });
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] LovCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.LovColumn) || string.IsNullOrWhiteSpace(dto.LovCode) || string.IsNullOrWhiteSpace(dto.LovDesc))
            {
                return BadRequest(new { isSuccess = false, message = "Column, Code, and Display Text are all required." });
            }

            var exists = await _context.LovMasters.AnyAsync(l =>
                l.LovColumn == dto.LovColumn && l.LovCode == dto.LovCode && !l.IsDeleted);
            if (exists)
            {
                return BadRequest(new { isSuccess = false, message = $"'{dto.LovCode}' already exists under '{dto.LovColumn}'." });
            }

            var category = await _context.LovCategories.FirstOrDefaultAsync(c => c.LovColumn == dto.LovColumn && !c.IsDeleted);
            if (category == null)
            {
                await _context.LovCategories.AddAsync(new LovCategory
                {
                    LovColumn = dto.LovColumn.Trim(),
                    DisplayText = string.IsNullOrWhiteSpace(dto.CategoryDisplayText) ? dto.LovColumn.Trim() : dto.CategoryDisplayText.Trim(),
                    IsActive = true,
                    IsDeleted = false,
                    CreatedDate = DateTime.Now
                });
            }

            var row = new LovMaster
            {
                LovColumn = dto.LovColumn.Trim(),
                LovCode = dto.LovCode.Trim(),
                LovDesc = dto.LovDesc.Trim(),
                DisplayOrder = dto.DisplayOrder,
                IsActive = true,
                IsDeleted = false,
                CreatedDate = DateTime.Now
            };

            await _context.LovMasters.AddAsync(row);
            await _context.SaveChangesAsync();

            return Ok(new { isSuccess = true, item = row });
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] LovUpdateDto dto)
        {
            var row = await _context.LovMasters.FirstOrDefaultAsync(l => l.Id == id && !l.IsDeleted);
            if (row == null)
            {
                return NotFound(new { isSuccess = false, message = "Entry not found." });
            }

            if (string.IsNullOrWhiteSpace(dto.LovDesc))
            {
                return BadRequest(new { isSuccess = false, message = "Display Text is required." });
            }

            row.LovDesc = dto.LovDesc.Trim();
            row.DisplayOrder = dto.DisplayOrder;
            row.IsActive = dto.IsActive;
            row.LastModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(new { isSuccess = true, item = row });
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var row = await _context.LovMasters.FirstOrDefaultAsync(l => l.Id == id && !l.IsDeleted);
            if (row == null)
            {
                return NotFound(new { isSuccess = false, message = "Entry not found." });
            }

            row.IsActive = false;
            row.IsDeleted = true;
            row.LastModifiedDate = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(new { isSuccess = true });
        }
    }
}
