using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hiya2.Server.Services;

namespace Hiya2.Server.Controllers
{
    // Website visitor numbers from Google Analytics (HiyaGhar web stream only) for the admin
    // dashboard and the Website Analytics page. Admin staff only. Each endpoint takes either
    // ?range=today|yesterday|7|14|30 or ?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd.
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WebsiteAnalyticsController : ControllerBase
    {
        private readonly IGoogleAnalyticsService _analytics;

        public WebsiteAnalyticsController(IGoogleAnalyticsService analytics)
        {
            _analytics = analytics;
        }

        private bool IsStaff() => User.FindFirstValue("token_type") == "staff";

        // GET api/WebsiteAnalytics/summary - active users + page views for the range
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary([FromQuery] string? range, [FromQuery] string? startDate, [FromQuery] string? endDate)
        {
            if (!IsStaff()) return Forbid();
            var dates = _analytics.ResolveRange(range, startDate, endDate);
            if (!dates.IsSuccess || dates.Data == null) return BadRequest(new { isSuccess = false, message = dates.Message });

            var result = await _analytics.GetSummaryAsync(dates.Data);
            if (!result.IsSuccess || result.Data == null) return Unavailable(result.Message);

            return Ok(new
            {
                isSuccess = true,
                rangeType = dates.Data.GaDay ?? "dates",
                startDate = dates.Data.StartDate.ToString("yyyy-MM-dd"),
                endDate = dates.Data.EndDate.ToString("yyyy-MM-dd"),
                activeUsers = result.Data.ActiveUsers,
                pageViews = result.Data.PageViews,
            });
        }

        // GET api/WebsiteAnalytics/daily - active users per day (days without visitors included as 0).
        // For today / yesterday: active users per hour instead (granularity "hour", list "hours").
        [HttpGet("daily")]
        public async Task<IActionResult> GetDaily([FromQuery] string? range, [FromQuery] string? startDate, [FromQuery] string? endDate)
        {
            if (!IsStaff()) return Forbid();
            var dates = _analytics.ResolveRange(range, startDate, endDate);
            if (!dates.IsSuccess || dates.Data == null) return BadRequest(new { isSuccess = false, message = dates.Message });

            if (dates.Data.IsHourly)
            {
                var hourly = await _analytics.GetHourlyAsync(dates.Data);
                if (!hourly.IsSuccess || hourly.Data == null) return Unavailable(hourly.Message);

                return Ok(new
                {
                    isSuccess = true,
                    rangeType = dates.Data.GaDay,
                    granularity = "hour",
                    startDate = dates.Data.StartDate.ToString("yyyy-MM-dd"),
                    endDate = dates.Data.EndDate.ToString("yyyy-MM-dd"),
                    hours = hourly.Data,
                });
            }

            var result = await _analytics.GetDailyAsync(dates.Data);
            if (!result.IsSuccess || result.Data == null) return Unavailable(result.Message);

            return Ok(new
            {
                isSuccess = true,
                rangeType = dates.Data.GaDay ?? "dates",
                granularity = "day",
                startDate = dates.Data.StartDate.ToString("yyyy-MM-dd"),
                endDate = dates.Data.EndDate.ToString("yyyy-MM-dd"),
                days = result.Data,
            });
        }

        // GET api/WebsiteAnalytics/pages?top=5 - page path, views, active users (most viewed first)
        [HttpGet("pages")]
        public async Task<IActionResult> GetPages([FromQuery] string? range, [FromQuery] string? startDate, [FromQuery] string? endDate, [FromQuery] int? top)
        {
            if (!IsStaff()) return Forbid();
            if (top is <= 0) return BadRequest(new { isSuccess = false, message = "top must be a positive number." });
            var dates = _analytics.ResolveRange(range, startDate, endDate);
            if (!dates.IsSuccess || dates.Data == null) return BadRequest(new { isSuccess = false, message = dates.Message });

            var result = await _analytics.GetPagesAsync(dates.Data, top);
            if (!result.IsSuccess || result.Data == null) return Unavailable(result.Message);

            return Ok(new
            {
                isSuccess = true,
                rangeType = dates.Data.GaDay ?? "dates",
                startDate = dates.Data.StartDate.ToString("yyyy-MM-dd"),
                endDate = dates.Data.EndDate.ToString("yyyy-MM-dd"),
                pages = result.Data,
            });
        }

        // Google not reachable / not configured: the cause is already logged by the service.
        private ObjectResult Unavailable(string? message) =>
            StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                isSuccess = false,
                message = message ?? "Website analytics is not available right now.",
            });
    }
}
