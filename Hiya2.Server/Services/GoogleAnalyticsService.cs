using System.Globalization;
using Google.Analytics.Data.V1Beta;
using Google.Apis.Auth.OAuth2;
using Grpc.Core;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace Hiya2.Server.Services
{
    // "GoogleAnalytics" section of appsettings / environment variables
    // (on the server: GoogleAnalytics__PropertyId, GoogleAnalytics__StreamId, GoogleAnalytics__KeyFilePath).
    public class GoogleAnalyticsSettings
    {
        public string PropertyId { get; set; } = "";
        // The GA4 property holds more than one website; every query is limited to this web stream.
        public string StreamId { get; set; } = "";
        // Service account JSON key. Must live outside the project folders (never in wwwroot or Git).
        public string KeyFilePath { get; set; } = "";
    }

    public class VisitorDateRange
    {
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        // "today" / "yesterday": sent to Google as GA's own date words, so the day follows the GA
        // property time zone. Null for presets of several days and custom dates.
        public string? GaDay { get; set; }
        // Single-day ranges (today / yesterday) are charted per hour instead of per day.
        public bool IsHourly => GaDay != null;
    }

    public class VisitorHour
    {
        public int Hour { get; set; } // 0-23, GA property time zone
        public long ActiveUsers { get; set; }
    }

    public class VisitorSummary
    {
        public long ActiveUsers { get; set; }
        public long PageViews { get; set; }
    }

    public class VisitorDay
    {
        public string Date { get; set; } = ""; // yyyy-MM-dd
        public long ActiveUsers { get; set; }
    }

    public class VisitorPage
    {
        public string PagePath { get; set; } = "";
        public long Views { get; set; }
        public long ActiveUsers { get; set; }
    }

    public class AnalyticsResult<T>
    {
        public bool IsSuccess { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }

        public static AnalyticsResult<T> Ok(T data) => new() { IsSuccess = true, Data = data };
        public static AnalyticsResult<T> Fail(string message) => new() { IsSuccess = false, Message = message };
    }

    public interface IGoogleAnalyticsService
    {
        // Turns a preset ("today", "yesterday", or 7 / 14 / 30 days ending today) or a custom
        // yyyy-MM-dd range into dates, or returns an error message for invalid input.
        AnalyticsResult<VisitorDateRange> ResolveRange(string? range, string? startDate, string? endDate);
        Task<AnalyticsResult<VisitorSummary>> GetSummaryAsync(VisitorDateRange range);
        Task<AnalyticsResult<List<VisitorDay>>> GetDailyAsync(VisitorDateRange range);
        // Today / yesterday: active users per hour (today only up to the current hour).
        Task<AnalyticsResult<List<VisitorHour>>> GetHourlyAsync(VisitorDateRange range);
        Task<AnalyticsResult<List<VisitorPage>>> GetPagesAsync(VisitorDateRange range, int? top);
    }

    /// <summary>
    /// Website visitor numbers from the GA4 Data API (same figures as GA Reports > Engagement >
    /// Pages and screens, filtered to the HiyaGhar web stream). Results are cached for 45 minutes
    /// (today: 5 minutes) because the GA API has request quotas.
    /// </summary>
    public class GoogleAnalyticsService : IGoogleAnalyticsService
    {
        private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(45);
        // Today's numbers keep changing during the day, so they are kept only briefly.
        private static readonly TimeSpan TodayCacheDuration = TimeSpan.FromMinutes(5);
        private static readonly int[] PresetDays = { 7, 14, 30 };
        private const int MaxRangeMonths = 14;
        private const int MaxPageRows = 10000;

        private readonly GoogleAnalyticsSettings _settings;
        private readonly IMemoryCache _cache;
        private readonly ILogger<GoogleAnalyticsService> _logger;
        private readonly object _clientLock = new();
        private BetaAnalyticsDataClient? _client;

        public GoogleAnalyticsService(IOptions<GoogleAnalyticsSettings> settings, IMemoryCache cache, ILogger<GoogleAnalyticsService> logger)
        {
            _settings = settings.Value;
            _cache = cache;
            _logger = logger;
        }

        // GA reports in the property's time zone (India); the store's "today" is IST as well.
        private static DateTime NowIst() => DateTime.UtcNow.AddHours(5.5);
        private static DateOnly TodayIst() => DateOnly.FromDateTime(NowIst());

        public AnalyticsResult<VisitorDateRange> ResolveRange(string? range, string? startDate, string? endDate)
        {
            var today = TodayIst();
            var hasCustom = !string.IsNullOrWhiteSpace(startDate) || !string.IsNullOrWhiteSpace(endDate);

            if (!hasCustom)
            {
                var preset = string.IsNullOrWhiteSpace(range) ? "7" : range.Trim().ToLowerInvariant();
                // StartDate/EndDate are only for display; Google gets the word itself (see NewRequest).
                if (preset == "today")
                    return AnalyticsResult<VisitorDateRange>.Ok(new VisitorDateRange { StartDate = today, EndDate = today, GaDay = "today" });
                if (preset == "yesterday")
                    return AnalyticsResult<VisitorDateRange>.Ok(new VisitorDateRange { StartDate = today.AddDays(-1), EndDate = today.AddDays(-1), GaDay = "yesterday" });

                if (!int.TryParse(preset, NumberStyles.Integer, CultureInfo.InvariantCulture, out var days) || !PresetDays.Contains(days))
                    return AnalyticsResult<VisitorDateRange>.Fail("Range must be today, yesterday, 7, 14 or 30 days, or a custom start and end date.");
                // Same as the Sales & Revenue Trend chart: the last N days including today.
                return AnalyticsResult<VisitorDateRange>.Ok(new VisitorDateRange { StartDate = today.AddDays(-(days - 1)), EndDate = today });
            }

            if (!DateOnly.TryParseExact(startDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var start) ||
                !DateOnly.TryParseExact(endDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var end))
                return AnalyticsResult<VisitorDateRange>.Fail("Please give both a start date and an end date (yyyy-MM-dd).");
            if (end > today)
                return AnalyticsResult<VisitorDateRange>.Fail("End date cannot be in the future.");
            if (start > end)
                return AnalyticsResult<VisitorDateRange>.Fail("Start date must be on or before the end date.");
            if (start < end.AddMonths(-MaxRangeMonths))
                return AnalyticsResult<VisitorDateRange>.Fail($"Date range can be at most {MaxRangeMonths} months.");

            return AnalyticsResult<VisitorDateRange>.Ok(new VisitorDateRange { StartDate = start, EndDate = end });
        }

        public Task<AnalyticsResult<VisitorSummary>> GetSummaryAsync(VisitorDateRange range) =>
            CachedAsync(range, "summary", async client =>
            {
                // No pagePath dimension here: GA counts each user once for the whole range.
                // (Adding up the users of every page would count a user once per page visited.)
                var request = NewRequest(range);
                request.Metrics.Add(new Metric { Name = "activeUsers" });
                request.Metrics.Add(new Metric { Name = "screenPageViews" });

                var response = await client.RunReportAsync(request);
                var row = response.Rows.FirstOrDefault();
                return new VisitorSummary
                {
                    ActiveUsers = row == null ? 0 : ParseLong(row.MetricValues[0].Value),
                    PageViews = row == null ? 0 : ParseLong(row.MetricValues[1].Value),
                };
            });

        public Task<AnalyticsResult<List<VisitorDay>>> GetDailyAsync(VisitorDateRange range) =>
            CachedAsync(range, "daily", async client =>
            {
                var request = NewRequest(range);
                request.Dimensions.Add(new Dimension { Name = "date" });
                request.Metrics.Add(new Metric { Name = "activeUsers" });

                var response = await client.RunReportAsync(request);
                var byDate = response.Rows.ToDictionary(r => r.DimensionValues[0].Value, r => ParseLong(r.MetricValues[0].Value));

                // GA leaves out days without visitors; add them with 0 so the chart has no gaps.
                var days = new List<VisitorDay>();
                for (var d = range.StartDate; d <= range.EndDate; d = d.AddDays(1))
                {
                    days.Add(new VisitorDay
                    {
                        Date = d.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                        ActiveUsers = byDate.TryGetValue(d.ToString("yyyyMMdd", CultureInfo.InvariantCulture), out var users) ? users : 0,
                    });
                }
                return days;
            });

        public Task<AnalyticsResult<List<VisitorHour>>> GetHourlyAsync(VisitorDateRange range) =>
            CachedAsync(range, "hourly", async client =>
            {
                var request = NewRequest(range);
                request.Dimensions.Add(new Dimension { Name = "hour" }); // "00".."23", GA property time zone
                request.Metrics.Add(new Metric { Name = "activeUsers" });

                var response = await client.RunReportAsync(request);
                var byHour = new Dictionary<int, long>();
                foreach (var r in response.Rows)
                {
                    if (int.TryParse(r.DimensionValues[0].Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var h))
                        byHour[h] = ParseLong(r.MetricValues[0].Value);
                }

                // Every hour with 0 for hours without visitors; today only up to the current hour (India).
                var lastHour = range.GaDay == "today" ? NowIst().Hour : 23;
                return Enumerable.Range(0, lastHour + 1)
                    .Select(h => new VisitorHour { Hour = h, ActiveUsers = byHour.TryGetValue(h, out var users) ? users : 0 })
                    .ToList();
            });

        public Task<AnalyticsResult<List<VisitorPage>>> GetPagesAsync(VisitorDateRange range, int? top)
        {
            var limit = top is > 0 ? Math.Min(top.Value, MaxPageRows) : MaxPageRows;
            return CachedAsync(range, $"pages:{limit}", async client =>
            {
                var request = NewRequest(range);
                request.Dimensions.Add(new Dimension { Name = "pagePath" });
                request.Metrics.Add(new Metric { Name = "screenPageViews" });
                request.Metrics.Add(new Metric { Name = "activeUsers" });
                request.OrderBys.Add(new OrderBy { Metric = new OrderBy.Types.MetricOrderBy { MetricName = "screenPageViews" }, Desc = true });
                request.Limit = limit;

                var response = await client.RunReportAsync(request);
                return response.Rows.Select(r => new VisitorPage
                {
                    PagePath = r.DimensionValues[0].Value,
                    Views = ParseLong(r.MetricValues[0].Value),
                    ActiveUsers = ParseLong(r.MetricValues[1].Value),
                }).ToList();
            });
        }

        // Every query: the configured property, the date range, and ONLY the HiyaGhar web stream
        // (the property also holds another website).
        private RunReportRequest NewRequest(VisitorDateRange range) => new()
        {
            Property = $"properties/{_settings.PropertyId.Trim()}",
            DateRanges =
            {
                // "today" / "yesterday" go to Google as words so the day follows the GA property time zone.
                new DateRange
                {
                    StartDate = range.GaDay ?? range.StartDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    EndDate = range.GaDay ?? range.EndDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                },
            },
            DimensionFilter = new FilterExpression
            {
                Filter = new Filter
                {
                    FieldName = "streamId",
                    StringFilter = new Filter.Types.StringFilter
                    {
                        MatchType = Filter.Types.StringFilter.Types.MatchType.Exact,
                        Value = _settings.StreamId.Trim(),
                    },
                },
            },
        };

        private static long ParseLong(string value) =>
            long.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var n) ? n : 0;

        private async Task<AnalyticsResult<T>> CachedAsync<T>(VisitorDateRange range, string kind, Func<BetaAnalyticsDataClient, Task<T>> query)
        {
            // The key holds the real dates, so after midnight "today" never returns yesterday's numbers.
            var key = $"{kind}:{range.GaDay ?? "dates"}:{range.StartDate:yyyyMMdd}:{range.EndDate:yyyyMMdd}";
            var cacheKey = "ga4:" + key;
            var cacheDuration = range.GaDay == "today" ? TodayCacheDuration : CacheDuration;
            if (_cache.TryGetValue(cacheKey, out T? cached) && cached != null)
                return AnalyticsResult<T>.Ok(cached);

            var clientResult = GetClient();
            if (!clientResult.IsSuccess || clientResult.Data == null)
                return AnalyticsResult<T>.Fail(clientResult.Message ?? "Website analytics is not available right now.");

            try
            {
                var data = await query(clientResult.Data);
                _cache.Set(cacheKey, data, cacheDuration); // only successful results are cached
                return AnalyticsResult<T>.Ok(data);
            }
            catch (RpcException ex)
            {
                return AnalyticsResult<T>.Fail(DescribeGoogleError(ex));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Google Analytics query failed ({Key}).", key);
                return AnalyticsResult<T>.Fail("Could not load website analytics from Google right now. Please try again later.");
            }
        }

        private string DescribeGoogleError(RpcException ex)
        {
            switch (ex.StatusCode)
            {
                case StatusCode.PermissionDenied:
                    _logger.LogError(ex, "Google Analytics: permission denied for property {PropertyId}. Add the service account as a Viewer on this GA4 property.", _settings.PropertyId);
                    return "The analytics service account does not have access to this Google Analytics property.";
                case StatusCode.NotFound:
                case StatusCode.InvalidArgument:
                    _logger.LogError(ex, "Google Analytics rejected the request for property {PropertyId} / stream {StreamId}. Check GoogleAnalytics:PropertyId and GoogleAnalytics:StreamId.", _settings.PropertyId, _settings.StreamId);
                    return "Google Analytics rejected the request. Please check the configured Property ID and Stream ID.";
                case StatusCode.Unauthenticated:
                    _logger.LogError(ex, "Google Analytics: the service account key was not accepted. The key may have been deleted or disabled.");
                    return "The Google Analytics key was not accepted. Please check the service account key.";
                case StatusCode.ResourceExhausted:
                    _logger.LogWarning(ex, "Google Analytics: API quota exhausted for property {PropertyId}.", _settings.PropertyId);
                    return "Google Analytics request limit reached. Please try again in a while.";
                default:
                    _logger.LogError(ex, "Google Analytics request failed with status {Status}.", ex.StatusCode);
                    return "Could not load website analytics from Google right now. Please try again later.";
            }
        }

        // Built once and reused (the client is thread-safe). A failed build is not remembered, so a
        // key file added or fixed later is picked up without a restart.
        private AnalyticsResult<BetaAnalyticsDataClient> GetClient()
        {
            if (_client != null) return AnalyticsResult<BetaAnalyticsDataClient>.Ok(_client);

            lock (_clientLock)
            {
                if (_client != null) return AnalyticsResult<BetaAnalyticsDataClient>.Ok(_client);

                if (string.IsNullOrWhiteSpace(_settings.PropertyId) || string.IsNullOrWhiteSpace(_settings.StreamId) || string.IsNullOrWhiteSpace(_settings.KeyFilePath))
                {
                    _logger.LogError("Google Analytics is not configured: set GoogleAnalytics:PropertyId, GoogleAnalytics:StreamId and GoogleAnalytics:KeyFilePath.");
                    return AnalyticsResult<BetaAnalyticsDataClient>.Fail("Website analytics is not configured on the server yet.");
                }

                if (!File.Exists(_settings.KeyFilePath))
                {
                    _logger.LogError("Google Analytics key file not found at '{KeyFilePath}' (GoogleAnalytics:KeyFilePath).", _settings.KeyFilePath);
                    return AnalyticsResult<BetaAnalyticsDataClient>.Fail("Website analytics is not configured on the server: the Google key file is missing.");
                }

                try
                {
                    var credential = CredentialFactory.FromFile<ServiceAccountCredential>(_settings.KeyFilePath).ToGoogleCredential();
                    _client = new BetaAnalyticsDataClientBuilder { GoogleCredential = credential }.Build();
                    return AnalyticsResult<BetaAnalyticsDataClient>.Ok(_client);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Google Analytics key file at '{KeyFilePath}' could not be read as a service account key.", _settings.KeyFilePath);
                    return AnalyticsResult<BetaAnalyticsDataClient>.Fail("Website analytics is not configured correctly: the Google key file is not a valid service account key.");
                }
            }
        }
    }
}
