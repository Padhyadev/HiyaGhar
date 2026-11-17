using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hiya2.Server.Repositories.Review;
using Hiya2.Server.Authorization;
using Hiya2.Server.Services;
using HIyaghar.Infra;

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
        private readonly DataContext _db;

        public ReviewController(IReviewRepository repository, DataContext db)
        {
            _repository = repository;
            _db = db;
        }

        // Reviews are written by customers (incl. guest checkouts), never with an admin token.
        private bool IsCustomer() => User.FindFirstValue("token_type") == "customer";

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
            var verified = await ReviewVerification.VerifiedReviewIdsAsync(_db, reviews);

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
                    createdDate = r.CreatedDate,
                    verified = verified.Contains(r.Id),
                })
            });
        }

        [HttpGet("homepage")]
        [AllowAnonymous]
        public async Task<IActionResult> GetHomepageReviews()
        {
            var reviews = await _repository.GetFeaturedReviewsAsync(10);
            var verified = await ReviewVerification.VerifiedReviewIdsAsync(_db, reviews);
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
                    // Only reviews by customers who received the product (Services/ReviewVerification.cs).
                    verified = verified.Contains(r.Id),
                    location = verified.Contains(r.Id) ? "Verified Buyer" : null,
                    date = FormatRelativeTime(r.CreatedDate)
                })
            });
        }

        [HttpGet("admin")]
        [Authorize(Policy = AuthPolicies.Staff)]
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
        [Authorize(Policy = AuthPolicies.Staff)]
        public async Task<IActionResult> SetStatus(long id, [FromBody] ReviewStatusDto dto)
        {
            var updated = await _repository.SetActiveAsync(id, dto.IsActive);
            if (!updated) return NotFound(new { isSuccess = false, message = "Review not found." });
            return Ok(new { isSuccess = true, message = dto.IsActive ? "Review activated." : "Review deactivated." });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = AuthPolicies.Staff)]
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
            if (customerId <= 0 || !IsCustomer()) return Unauthorized();

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

            // Only real buyers: a delivered order with this product (any linked guest/registered account).
            var linked = await ReviewVerification.LinkedCustomerIdsAsync(_db, customerId);
            if (!await ReviewVerification.HasDeliveredOrderAsync(_db, linked, dto.ProductId))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { isSuccess = false, message = "Only customers who have received this product can review it." });
            }
            if (await ReviewVerification.HasReviewedAsync(_db, linked, dto.ProductId))
            {
                return Conflict(new { isSuccess = false, message = "You have already reviewed this product." });
            }

            await _repository.AddAsync(customerId, dto.ProductId, dto.Rating, dto.ReviewText.Trim());
            return Ok(new { isSuccess = true, message = "Review submitted." });
        }

        // GET api/Review/can-review/5 - may the logged-in customer review this product? (product page form)
        [HttpGet("can-review/{productId}")]
        [Authorize]
        public async Task<IActionResult> CanReview(int productId)
        {
            var customerId = GetCurrentCustomerId();
            if (customerId <= 0 || !IsCustomer())
                return Ok(new { isSuccess = true, canReview = false, message = "Please log in with your customer account to review." });

            var linked = await ReviewVerification.LinkedCustomerIdsAsync(_db, customerId);
            if (await ReviewVerification.HasReviewedAsync(_db, linked, productId))
                return Ok(new { isSuccess = true, canReview = false, message = "You have already reviewed this product. Thank you!" });
            if (!await ReviewVerification.HasDeliveredOrderAsync(_db, linked, productId))
                return Ok(new { isSuccess = true, canReview = false, message = "Only customers who have received this product can review it." });
            return Ok(new { isSuccess = true, canReview = true });
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
