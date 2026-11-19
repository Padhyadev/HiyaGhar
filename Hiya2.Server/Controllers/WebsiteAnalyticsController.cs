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

        // GET api/WebsiteAnalytics/realtime - people on the website right now (last 30 / last 5
        // minutes), with their pages, countries, cities and devices. No range: always "now".
        [HttpGet("realtime")]
        public async Task<IActionResult> GetRealtime()
        {
            if (!IsStaff()) return Forbid();

            var result = await _analytics.GetRealtimeAsync();
            if (!result.IsSuccess || result.Data == null) return Unavailable(result.Message);

            var d = result.Data;
            return Ok(new
            {
                isSuccess = true,
                activeUsers30Min = d.ActiveUsers30Min,
                activeUsers5Min = d.ActiveUsers5Min,
                pageViews30Min = d.PageViews30Min,
                perMinute = d.PerMinute,
                pages = d.Pages,
                countries = d.Countries,
                cities = d.Cities,
                devices = d.Devices,
                fetchedAtUtc = d.FetchedAtUtc,
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

        // GET api/WebsiteAnalytics/ai-referrals - visits from ChatGPT, Perplexity, Gemini, Copilot and Claude
        [HttpGet("ai-referrals")]
        public async Task<IActionResult> GetAiReferrals([FromQuery] string? range, [FromQuery] string? startDate, [FromQuery] string? endDate)
        {
            if (!IsStaff()) return Forbid();
            var dates = _analytics.ResolveRange(range, startDate, endDate);
            if (!dates.IsSuccess || dates.Data == null) return BadRequest(new { isSuccess = false, message = dates.Message });

            var result = await _analytics.GetAiReferralsAsync(dates.Data);
            if (!result.IsSuccess || result.Data == null) return Unavailable(result.Message);

            return Ok(new
            {
                isSuccess = true,
                rangeType = dates.Data.GaDay ?? "dates",
                startDate = dates.Data.StartDate.ToString("yyyy-MM-dd"),
                endDate = dates.Data.EndDate.ToString("yyyy-MM-dd"),
                tools = result.Data.Tools,
                totalSessions = result.Data.TotalSessions,
                totalUsers = result.Data.TotalUsers,
            });
        }

        // Google not reachable / not configured: the cause is already logged by the service.
        private ObjectResult Unavailable(string? message) =>
            StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                isSuccess = false,
                message = message ?? "Website analytics is not available right now.",
            });

        // GET api/WebsiteAnalytics/extended-summary - total users, new users, sessions, events, etc.
        [HttpGet("extended-summary")]
        public async Task<IActionResult> GetExtendedSummary([FromQuery] string? range, [FromQuery] string? startDate, [FromQuery] string? endDate)
        {
            if (!IsStaff()) return Forbid();
            var dates = _analytics.ResolveRange(range, startDate, endDate);
            if (!dates.IsSuccess || dates.Data == null) return BadRequest(new { isSuccess = false, message = dates.Message });

            var result = await _analytics.GetExtendedSummaryAsync(dates.Data);
            if (!result.IsSuccess || result.Data == null) return Unavailable(result.Message);

            return Ok(new
            {
                isSuccess = true,
                rangeType = dates.Data.GaDay ?? "dates",
                startDate = dates.Data.StartDate.ToString("yyyy-MM-dd"),
                endDate = dates.Data.EndDate.ToString("yyyy-MM-dd"),
                activeUsers = result.Data.ActiveUsers,
                pageViews = result.Data.PageViews,
                totalUsers = result.Data.TotalUsers,
                newUsers = result.Data.NewUsers,
                returningUsers = result.Data.ReturningUsers,
                sessions = result.Data.Sessions,
                eventCount = result.Data.EventCount,
                averageEngagementTimeSeconds = result.Data.AverageEngagementTimeSeconds,
            });
        }

        // GET api/WebsiteAnalytics/all-metrics-with-previous - all metrics with current and previous period
        [HttpGet("all-metrics-with-previous")]
        public async Task<IActionResult> GetAllMetricsWithPrevious([FromQuery] string? range, [FromQuery] string? startDate, [FromQuery] string? endDate)
        {
            if (!IsStaff()) return Forbid();
            var dates = _analytics.ResolveRange(range, startDate, endDate);
            if (!dates.IsSuccess || dates.Data == null) return BadRequest(new { isSuccess = false, message = dates.Message });

            var result = await _analytics.GetAllMetricsWithPreviousPeriodAsync(dates.Data);
            if (!result.IsSuccess || result.Data == null) return Unavailable(result.Message);

            return Ok(new
            {
                isSuccess = true,
                rangeType = dates.Data.GaDay ?? "dates",
                startDate = dates.Data.StartDate.ToString("yyyy-MM-dd"),
                endDate = dates.Data.EndDate.ToString("yyyy-MM-dd"),
                current = new
                {
                    activeUsers = result.Data.Current.ActiveUsers,
                    pageViews = result.Data.Current.PageViews,
                    totalUsers = result.Data.Current.TotalUsers,
                    newUsers = result.Data.Current.NewUsers,
                    returningUsers = result.Data.Current.ReturningUsers,
                    sessions = result.Data.Current.Sessions,
                    eventCount = result.Data.Current.EventCount,
                    averageEngagementTimeSeconds = result.Data.Current.AverageEngagementTimeSeconds,
                },
                previous = new
                {
                    activeUsers = result.Data.Previous.ActiveUsers,
                    pageViews = result.Data.Previous.PageViews,
                    totalUsers = result.Data.Previous.TotalUsers,
                    newUsers = result.Data.Previous.NewUsers,
                    returningUsers = result.Data.Previous.ReturningUsers,
                    sessions = result.Data.Previous.Sessions,
                    eventCount = result.Data.Previous.EventCount,
                    averageEngagementTimeSeconds = result.Data.Previous.AverageEngagementTimeSeconds,
                },
            });
        }

        // GET api/WebsiteAnalytics/session-channels - sessions by channel grouping
        [HttpGet("session-channels")]
        public async Task<IActionResult> GetSessionChannels([FromQuery] string? range, [FromQuery] string? startDate, [FromQuery] string? endDate)
        {
            if (!IsStaff()) return Forbid();
            var dates = _analytics.ResolveRange(range, startDate, endDate);
            if (!dates.IsSuccess || dates.Data == null) return BadRequest(new { isSuccess = false, message = dates.Message });

            var result = await _analytics.GetSessionChannelsAsync(dates.Data);
            if (!result.IsSuccess || result.Data == null) return Unavailable(result.Message);

            return Ok(new
            {
                isSuccess = true,
                rangeType = dates.Data.GaDay ?? "dates",
                startDate = dates.Data.StartDate.ToString("yyyy-MM-dd"),
                endDate = dates.Data.EndDate.ToString("yyyy-MM-dd"),
                channels = result.Data.Channels,
                totalSessions = result.Data.TotalSessions,
            });
        }

        // GET api/WebsiteAnalytics/top-traffic-sources?top=10 - top traffic sources
        [HttpGet("top-traffic-sources")]
        public async Task<IActionResult> GetTopTrafficSources([FromQuery] string? range, [FromQuery] string? startDate, [FromQuery] string? endDate, [FromQuery] int? top)
        {
            if (!IsStaff()) return Forbid();
            if (top is <= 0) return BadRequest(new { isSuccess = false, message = "top must be a positive number." });
            var dates = _analytics.ResolveRange(range, startDate, endDate);
            if (!dates.IsSuccess || dates.Data == null) return BadRequest(new { isSuccess = false, message = dates.Message });

            var result = await _analytics.GetTopTrafficSourcesAsync(dates.Data, top ?? 10);
            if (!result.IsSuccess || result.Data == null) return Unavailable(result.Message);

            return Ok(new
            {
                isSuccess = true,
                rangeType = dates.Data.GaDay ?? "dates",
                startDate = dates.Data.StartDate.ToString("yyyy-MM-dd"),
                endDate = dates.Data.EndDate.ToString("yyyy-MM-dd"),
                sources = result.Data,
            });
        }

        // GET api/WebsiteAnalytics/geo?top=10 - top countries and cities
        [HttpGet("geo")]
        public async Task<IActionResult> GetGeo([FromQuery] string? range, [FromQuery] string? startDate, [FromQuery] string? endDate, [FromQuery] int? top)
        {
            if (!IsStaff()) return Forbid();
            if (top is <= 0) return BadRequest(new { isSuccess = false, message = "top must be a positive number." });
            var dates = _analytics.ResolveRange(range, startDate, endDate);
            if (!dates.IsSuccess || dates.Data == null) return BadRequest(new { isSuccess = false, message = dates.Message });

            var result = await _analytics.GetGeoReportAsync(dates.Data, top ?? 10);
            if (!result.IsSuccess || result.Data == null) return Unavailable(result.Message);

            return Ok(new
            {
                isSuccess = true,
                rangeType = dates.Data.GaDay ?? "dates",
                startDate = dates.Data.StartDate.ToString("yyyy-MM-dd"),
                endDate = dates.Data.EndDate.ToString("yyyy-MM-dd"),
                countries = result.Data.Countries,
                cities = result.Data.Cities,
            });
        }

        // GET api/WebsiteAnalytics/devices - device category breakdown
        [HttpGet("devices")]
        public async Task<IActionResult> GetDevices([FromQuery] string? range, [FromQuery] string? startDate, [FromQuery] string? endDate)
        {
            if (!IsStaff()) return Forbid();
            var dates = _analytics.ResolveRange(range, startDate, endDate);
            if (!dates.IsSuccess || dates.Data == null) return BadRequest(new { isSuccess = false, message = dates.Message });

            var result = await _analytics.GetDeviceReportAsync(dates.Data);
            if (!result.IsSuccess || result.Data == null) return Unavailable(result.Message);

            return Ok(new
            {
                isSuccess = true,
                rangeType = dates.Data.GaDay ?? "dates",
                startDate = dates.Data.StartDate.ToString("yyyy-MM-dd"),
                endDate = dates.Data.EndDate.ToString("yyyy-MM-dd"),
                categories = result.Data.Categories,
                totalUsers = result.Data.TotalUsers,
            });
        }
    }
}
