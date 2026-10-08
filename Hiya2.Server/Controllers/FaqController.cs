using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;

namespace Hiya2.Server.Controllers
{
    public class FaqCreateUpdateDto
    {
        public string Category { get; set; } = "general";
        public string Question { get; set; } = string.Empty;
        public string Answer { get; set; } = string.Empty;
        public int DisplayOrder { get; set; } = 0;
        public bool IsActive { get; set; } = true;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class FaqController : ControllerBase
    {
        private readonly DataContext _context;

        public FaqController(DataContext context)
        {
            _context = context;
        }

        // GET: api/Faq (Public - Active FAQs for Website)
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicFaqs()
        {
            try
            {
                var faqs = await _context.Faqs
                    .Where(f => !f.IsDeleted && f.IsActive)
                    .OrderBy(f => f.DisplayOrder)
                    .ThenBy(f => f.Id)
                    .Select(f => new
                    {
                        f.Id,
                        f.Category,
                        f.Question,
                        f.Answer,
                        f.DisplayOrder
                    })
                    .ToListAsync();

                return Ok(new { isSuccess = true, data = faqs });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { isSuccess = false, message = ex.Message });
            }
        }

        // GET: api/Faq/admin/all (Admin - All FAQs with filtering)
        [HttpGet("admin/all")]
        [Authorize]
        public async Task<IActionResult> GetAllAdminFaqs([FromQuery] string? category, [FromQuery] string? search)
        {
            try
            {
                var query = _context.Faqs.Where(f => !f.IsDeleted);

                if (!string.IsNullOrWhiteSpace(category) && category != "all")
                {
                    query = query.Where(f => f.Category.ToLower() == category.ToLower());
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var s = search.Trim().ToLower();
                    query = query.Where(f => f.Question.ToLower().Contains(s) || f.Answer.ToLower().Contains(s));
                }

                var list = await query
                    .OrderBy(f => f.DisplayOrder)
                    .ThenByDescending(f => f.Id)
                    .ToListAsync();

                return Ok(new { isSuccess = true, data = list, total = list.Count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { isSuccess = false, message = ex.Message });
            }
        }

        // GET: api/Faq/{id}
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetById(long id)
        {
            var faq = await _context.Faqs.FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);
            if (faq == null)
            {
                return NotFound(new { isSuccess = false, message = "FAQ not found." });
            }
            return Ok(new { isSuccess = true, data = faq });
        }

        // POST: api/Faq (Admin create)
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] FaqCreateUpdateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Question))
            {
                return BadRequest(new { isSuccess = false, message = "Question is required." });
            }
            if (string.IsNullOrWhiteSpace(dto.Answer))
            {
                return BadRequest(new { isSuccess = false, message = "Answer is required." });
            }

            var faq = new Faq
            {
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "general" : dto.Category.Trim().ToLower(),
                Question = dto.Question.Trim(),
                Answer = dto.Answer.Trim(),
                DisplayOrder = dto.DisplayOrder,
                IsActive = dto.IsActive,
                IsDeleted = false,
                CreatedDate = DateTime.Now
            };

            _context.Faqs.Add(faq);
            await _context.SaveChangesAsync();

            return Ok(new { isSuccess = true, message = "FAQ created successfully.", data = faq });
        }

        // PUT: api/Faq/{id} (Admin update)
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(long id, [FromBody] FaqCreateUpdateDto dto)
        {
            var faq = await _context.Faqs.FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);
            if (faq == null)
            {
                return NotFound(new { isSuccess = false, message = "FAQ not found." });
            }

            if (string.IsNullOrWhiteSpace(dto.Question))
            {
                return BadRequest(new { isSuccess = false, message = "Question is required." });
            }
            if (string.IsNullOrWhiteSpace(dto.Answer))
            {
                return BadRequest(new { isSuccess = false, message = "Answer is required." });
            }

            faq.Category = string.IsNullOrWhiteSpace(dto.Category) ? "general" : dto.Category.Trim().ToLower();
            faq.Question = dto.Question.Trim();
            faq.Answer = dto.Answer.Trim();
            faq.DisplayOrder = dto.DisplayOrder;
            faq.IsActive = dto.IsActive;
            faq.UpdatedDate = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new { isSuccess = true, message = "FAQ updated successfully.", data = faq });
        }

        // PATCH: api/Faq/{id}/toggle-status
        [HttpPatch("{id}/toggle-status")]
        [Authorize]
        public async Task<IActionResult> ToggleStatus(long id)
        {
            var faq = await _context.Faqs.FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);
            if (faq == null)
            {
                return NotFound(new { isSuccess = false, message = "FAQ not found." });
            }

            faq.IsActive = !faq.IsActive;
            faq.UpdatedDate = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { isSuccess = true, message = $"FAQ {(faq.IsActive ? "activated" : "deactivated")} successfully.", isActive = faq.IsActive });
        }

        // DELETE: api/Faq/{id} (Soft delete)
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(long id)
        {
            var faq = await _context.Faqs.FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted);
            if (faq == null)
            {
                return NotFound(new { isSuccess = false, message = "FAQ not found." });
            }

            faq.IsDeleted = true;
            faq.UpdatedDate = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { isSuccess = true, message = "FAQ deleted successfully." });
        }
    }
}
