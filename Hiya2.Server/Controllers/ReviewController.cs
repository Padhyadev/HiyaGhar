using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hiya2.Server.Repositories.Review;

namespace Hiya2.Server.Controllers
{
    public class ReviewRequestDto
    {
        public int ProductId { get; set; }
        public int Rating { get; set; }
        public string ReviewText { get; set; } = string.Empty;
    }

    public class ReviewStatusDto
    {
        public bool IsActive { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewRepository _repository;

        public ReviewController(IReviewRepository repository)
        {
            _repository = repository;
        }

        private long GetCurrentCustomerId()
        {
            var claimSub = User.FindFirstValue("CustomerId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            return long.TryParse(claimSub, out var id) ? id : 0;
        }

        [HttpGet("product/{productId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByProduct(int productId)
        {
            var (reviews, averageRating, totalCount) = await _repository.GetByProductAsync(productId);

            return Ok(new
            {
                isSuccess = true,
                averageRating = Math.Round(averageRating, 1),
                totalReviews = totalCount,
                reviews = reviews.Select(r => new
                {
                    id = r.Id,
                    customerName = BuildCustomerName(r.Customer),
                    rating = r.Rating,
                    reviewText = r.ReviewText,
                    createdDate = r.CreatedDate
                })
            });
        }

        [HttpGet("homepage")]
        [AllowAnonymous]
        public async Task<IActionResult> GetHomepageReviews()
        {
            var reviews = await _repository.GetFeaturedReviewsAsync(12);
            var (averageRating, totalReviews) = await _repository.GetOverallStatsAsync();

            return Ok(new
            {
                isSuccess = true,
                averageRating,
                totalReviews,
                reviews = reviews.Select(r => new
                {
                    id = $"rev-{r.Id}",
                    customerName = BuildCustomerName(r.Customer),
                    rating = r.Rating,
                    review = r.ReviewText,
                    productName = r.Product?.ProductName ?? "Hiya Authentic Product",
                    verified = true,
                    location = "Verified Buyer",
                    date = FormatRelativeTime(r.CreatedDate)
                })
            });
        }

        [HttpGet("admin")]
        [Authorize]
        public async Task<IActionResult> GetAllForAdmin()
        {
            var reviews = await _repository.GetAllForAdminAsync();

            return Ok(reviews.Select(r => new
            {
                id = r.Id,
                productId = r.ProductId,
                productName = r.Product?.ProductName,
                customerName = BuildCustomerName(r.Customer),
                rating = r.Rating,
                reviewText = r.ReviewText,
                createdDate = r.CreatedDate,
                isActive = r.IsActive
            }));
        }

        [HttpPut("{id}/status")]
        [Authorize]
        public async Task<IActionResult> SetStatus(long id, [FromBody] ReviewStatusDto dto)
        {
            var updated = await _repository.SetActiveAsync(id, dto.IsActive);
            if (!updated) return NotFound(new { isSuccess = false, message = "Review not found." });
            return Ok(new { isSuccess = true, message = dto.IsActive ? "Review activated." : "Review deactivated." });
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(long id)
        {
            var deleted = await _repository.DeleteAsync(id);
            if (!deleted) return NotFound(new { isSuccess = false, message = "Review not found." });
            return Ok(new { isSuccess = true, message = "Review deleted." });
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Add([FromBody] ReviewRequestDto dto)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0) return Unauthorized();

            if (dto.ProductId <= 0)
            {
                return BadRequest(new { isSuccess = false, message = "A valid product is required." });
            }

            if (dto.Rating < 1 || dto.Rating > 5)
            {
                return BadRequest(new { isSuccess = false, message = "Rating must be between 1 and 5." });
            }

            if (string.IsNullOrWhiteSpace(dto.ReviewText))
            {
                return BadRequest(new { isSuccess = false, message = "Review text is required." });
            }

            await _repository.AddAsync(customerId, dto.ProductId, dto.Rating, dto.ReviewText.Trim());
            return Ok(new { isSuccess = true, message = "Review submitted." });
        }

        private static string BuildCustomerName(Models.Customer? customer)
        {
            if (customer == null) return "Anonymous";
            var lastInitial = !string.IsNullOrEmpty(customer.LastName) ? $"{customer.LastName[0]}." : string.Empty;
            return $"{customer.FirstName} {lastInitial}".Trim();
        }

        private static string FormatRelativeTime(DateTime createdDate)
        {
            var span = DateTime.Now - createdDate;
            if (span.TotalDays < 1) return "Today";
            if (span.TotalDays < 7) return $"{(int)span.TotalDays} days ago";
            if (span.TotalDays < 30) return $"{(int)(span.TotalDays / 7)} weeks ago";
            if (span.TotalDays < 365) return $"{(int)(span.TotalDays / 30)} months ago";
            return $"{(int)(span.TotalDays / 365)} years ago";
        }
    }
}
