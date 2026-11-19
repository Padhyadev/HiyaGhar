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
        // Absolute (F:\Secrets\hiyaghar-ga-key.json) or relative to the app folder (..\Secrets\hiyaghar-ga-key.json).
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
        // Today only: GA has not processed this hour yet (standard reports run a few hours behind),
        // so 0 here means "unknown", not "no visitors".
        public bool Pending { get; set; }
    }

    public class VisitorSummary
    {
        public long ActiveUsers { get; set; }
        public long PageViews { get; set; }
    }

    public class VisitorExtendedSummary
    {
        public long ActiveUsers { get; set; }
        public long PageViews { get; set; }
        public long TotalUsers { get; set; }
        public long NewUsers { get; set; }
        public long ReturningUsers { get; set; }
        public long Sessions { get; set; }
        public long EventCount { get; set; }
        public double AverageEngagementTimeSeconds { get; set; }
    }

    public class VisitorExtendedSummaryWithPrevious
    {
        public VisitorExtendedSummary Current { get; set; } = new();
        public VisitorExtendedSummary Previous { get; set; } = new();
    }

    public class SessionChannel
    {
        public string Channel { get; set; } = "";
        public long Sessions { get; set; }
        public double Percentage { get; set; }
    }

    public class SessionChannelReport
    {
        public List<SessionChannel> Channels { get; set; } = new();
        public long TotalSessions { get; set; }
    }

    public class TrafficSource
    {
        public string Source { get; set; } = "";
        public string Medium { get; set; } = "";
        public long Sessions { get; set; }
        public long ActiveUsers { get; set; }
    }

    public class VisitorDay
    {
        public string Date { get; set; } = ""; // yyyy-MM-dd
        public long ActiveUsers { get; set; }
    }

    public class VisitorPage
    {
        public string PagePath { get; set; } = "";
        public string PageTitle { get; set; } = "";
        public long Views { get; set; }
        public long ActiveUsers { get; set; }
        public double AverageEngagementTimeSeconds { get; set; }
    }

    public class GeoLocationItem
    {
        public string Name { get; set; } = "";
        public long ActiveUsers { get; set; }
    }

    public class GeoReport
    {
        public List<GeoLocationItem> Countries { get; set; } = new();
        public List<GeoLocationItem> Cities { get; set; } = new();
    }

    public class DeviceCategoryItem
    {
        public string Category { get; set; } = ""; // Desktop, Mobile, Tablet
        public long ActiveUsers { get; set; }
        public double Percentage { get; set; }
    }

    public class DeviceReport
    {
        public List<DeviceCategoryItem> Categories { get; set; } = new();
        public long TotalUsers { get; set; }
    }

    /// <summary>Visits that came from one AI assistant (a link to hiyaghar.com clicked inside it).</summary>
    public class AiReferral
    {
        public string Tool { get; set; } = "";
        public long Sessions { get; set; }
        public long ActiveUsers { get; set; }
    }

    public class AiReferralReport
    {
        /// <summary>Every tracked AI assistant, in a fixed order (0 when there were no visits).</summary>
        public List<AiReferral> Tools { get; set; } = new();
        public long TotalSessions { get; set; }
        /// <summary>Users counted once across all AI assistants (not the sum of the rows).</summary>
        public long TotalUsers { get; set; }
    }

    // Realtime: people on the website right now (GA4 Realtime API, last 30 minutes).
    public class RealtimeItem
    {
        public string Name { get; set; } = "";
        public long ActiveUsers { get; set; }
    }

    public class RealtimeReport
    {
        /// <summary>Active users in the last 30 minutes (same number as GA Realtime).</summary>
        public long ActiveUsers30Min { get; set; }
        /// <summary>Active users in the last 5 minutes (closest to "on the site right now").</summary>
        public long ActiveUsers5Min { get; set; }
        public long PageViews30Min { get; set; }
        /// <summary>30 values, oldest first: the last one is the current minute.</summary>
        public List<long> PerMinute { get; set; } = new();
        public List<RealtimeItem> Pages { get; set; } = new();
        public List<RealtimeItem> Countries { get; set; } = new();
        public List<RealtimeItem> Cities { get; set; } = new();
        public List<RealtimeItem> Devices { get; set; } = new();
        public DateTime FetchedAtUtc { get; set; }
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
        // Visits from AI assistants (ChatGPT, Perplexity, Gemini, Copilot, Claude) by session source.
        Task<AnalyticsResult<AiReferralReport>> GetAiReferralsAsync(VisitorDateRange range);
        // Extended summary metrics for Website Analytics page (total users, sessions, events, etc.).
        Task<AnalyticsResult<VisitorExtendedSummary>> GetExtendedSummaryAsync(VisitorDateRange range);
        // All extended metrics with current and previous period data for comparison.
        Task<AnalyticsResult<VisitorExtendedSummaryWithPrevious>> GetAllMetricsWithPreviousPeriodAsync(VisitorDateRange range);
        // Sessions by channel grouping for Website Analytics page.
        Task<AnalyticsResult<SessionChannelReport>> GetSessionChannelsAsync(VisitorDateRange range);
        // Top traffic sources for Website Analytics page.
        Task<AnalyticsResult<List<TrafficSource>>> GetTopTrafficSourcesAsync(VisitorDateRange range, int? top);
        // Visitors by Country and City (top 10 each).
        Task<AnalyticsResult<GeoReport>> GetGeoReportAsync(VisitorDateRange range, int? top);
        // Device category breakdown (Desktop, Mobile, Tablet).
        Task<AnalyticsResult<DeviceReport>> GetDeviceReportAsync(VisitorDateRange range);
        // People on the website right now (last 30 / last 5 minutes), cached for 30 seconds.
        Task<AnalyticsResult<RealtimeReport>> GetRealtimeAsync();
        // Startup check: logs whether the key file can be used (full path + reason). Never throws.
        void LogStartupStatus(string environmentName);
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
        // Realtime numbers: short cache so several admins refreshing do not use up the realtime quota.
        private static readonly TimeSpan RealtimeCacheDuration = TimeSpan.FromSeconds(30);
        private static readonly int[] PresetDays = { 7, 14, 30 };
        private const int MaxRangeMonths = 14;
        private const int MaxPageRows = 10000;

        private readonly GoogleAnalyticsSettings _settings;
        private readonly IMemoryCache _cache;
        private readonly ILogger<GoogleAnalyticsService> _logger;
        // App folder: a relative KeyFilePath is resolved from here (live server: the hiyaghar.com folder).
        private readonly string _contentRootPath;
        private readonly object _clientLock = new();
        private BetaAnalyticsDataClient? _client;

        public GoogleAnalyticsService(IOptions<GoogleAnalyticsSettings> settings, IMemoryCache cache, ILogger<GoogleAnalyticsService> logger, IHostEnvironment environment)
        {
            _settings = settings.Value;
            _cache = cache;
            _logger = logger;
            _contentRootPath = environment.ContentRootPath;
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

        private RunReportRequest NewExtendedSummaryRequest(VisitorDateRange range)
        {
            var request = NewRequest(range);
            request.Metrics.Add(new Metric { Name = "activeUsers" });
            request.Metrics.Add(new Metric { Name = "screenPageViews" });
            request.Metrics.Add(new Metric { Name = "totalUsers" });
            request.Metrics.Add(new Metric { Name = "newUsers" });
            request.Metrics.Add(new Metric { Name = "sessions" });
            request.Metrics.Add(new Metric { Name = "eventCount" });
            request.Metrics.Add(new Metric { Name = "userEngagementDuration" });
            return request;
        }

        private static VisitorExtendedSummary ParseExtendedSummary(RunReportResponse response)
        {
            var row = response.Rows.FirstOrDefault();
            if (row == null) return new VisitorExtendedSummary();

            var activeUsers = ParseLong(row.MetricValues[0].Value);
            var pageViews = ParseLong(row.MetricValues[1].Value);
            var totalUsers = ParseLong(row.MetricValues[2].Value);
            var newUsers = ParseLong(row.MetricValues[3].Value);
            var sessions = ParseLong(row.MetricValues[4].Value);
            var eventCount = ParseLong(row.MetricValues[5].Value);
            var engagementSec = ParseDouble(row.MetricValues[6].Value);

            var returningUsers = Math.Max(0, totalUsers - newUsers);
            var avgEngagement = activeUsers > 0 ? engagementSec / activeUsers : 0;

            return new VisitorExtendedSummary
            {
                ActiveUsers = activeUsers,
                PageViews = pageViews,
                TotalUsers = totalUsers,
                NewUsers = newUsers,
                ReturningUsers = returningUsers,
                Sessions = sessions,
                EventCount = eventCount,
                AverageEngagementTimeSeconds = avgEngagement,
            };
        }

        private VisitorDateRange GetPreviousPeriod(VisitorDateRange range)
        {
            var today = TodayIst();
            if (range.GaDay == "today")
            {
                return new VisitorDateRange
                {
                    StartDate = today.AddDays(-1),
                    EndDate = today.AddDays(-1),
                    GaDay = "yesterday",
                };
            }
            if (range.GaDay == "yesterday")
            {
                return new VisitorDateRange
                {
                    StartDate = today.AddDays(-2),
                    EndDate = today.AddDays(-2),
                    GaDay = null,
                };
            }

            var days = (range.EndDate.DayNumber - range.StartDate.DayNumber) + 1;
            var prevEnd = range.StartDate.AddDays(-1);
            var prevStart = prevEnd.AddDays(-(days - 1));

            return new VisitorDateRange
            {
                StartDate = prevStart,
                EndDate = prevEnd,
                GaDay = null,
            };
        }

        public Task<AnalyticsResult<VisitorExtendedSummary>> GetExtendedSummaryAsync(VisitorDateRange range) =>
            CachedAsync(range, "extendedSummary", async client =>
            {
                var request = NewExtendedSummaryRequest(range);
                var response = await client.RunReportAsync(request);
                return ParseExtendedSummary(response);
            });

        public Task<AnalyticsResult<VisitorExtendedSummaryWithPrevious>> GetAllMetricsWithPreviousPeriodAsync(VisitorDateRange range) =>
            CachedAsync(range, "extendedSummaryWithPrevious", async client =>
            {
                var currentRequest = NewExtendedSummaryRequest(range);
                var prevRange = GetPreviousPeriod(range);
                var previousRequest = NewExtendedSummaryRequest(prevRange);

                var currentTask = client.RunReportAsync(currentRequest);
                var previousTask = client.RunReportAsync(previousRequest);
                await System.Threading.Tasks.Task.WhenAll(currentTask, previousTask);

                var currentResponse = await currentTask;
                var previousResponse = await previousTask;

                return new VisitorExtendedSummaryWithPrevious
                {
                    Current = ParseExtendedSummary(currentResponse),
                    Previous = ParseExtendedSummary(previousResponse),
                };
            });

        public Task<AnalyticsResult<SessionChannelReport>> GetSessionChannelsAsync(VisitorDateRange range) =>
            CachedAsync(range, "sessionChannels", async client =>
            {
                var channelReq = NewRequest(range);
                channelReq.Dimensions.Add(new Dimension { Name = "sessionDefaultChannelGroup" });
                channelReq.Metrics.Add(new Metric { Name = "sessions" });

                var aiSources = AiTools.SelectMany(t => t.Sources).ToList();
                var aiReq = NewRequest(range);
                aiReq.Dimensions.Add(new Dimension { Name = "sessionSource" });
                aiReq.Metrics.Add(new Metric { Name = "sessions" });
                aiReq.DimensionFilter = new FilterExpression
                {
                    AndGroup = new FilterExpressionList
                    {
                        Expressions =
                        {
                            aiReq.DimensionFilter,
                            new FilterExpression
                            {
                                Filter = new Filter
                                {
                                    FieldName = "sessionSource",
                                    InListFilter = new Filter.Types.InListFilter { CaseSensitive = false, Values = { aiSources } }
                                }
                            }
                        }
                    }
                };

                var channelTask = client.RunReportAsync(channelReq);
                var aiTask = client.RunReportAsync(aiReq);
                await System.Threading.Tasks.Task.WhenAll(channelTask, aiTask);

                var channelRes = await channelTask;
                var aiRes = await aiTask;

                var channelSessions = channelRes.Rows.ToDictionary(
                    r => ParseString(r.DimensionValues[0].Value),
                    r => ParseLong(r.MetricValues[0].Value),
                    StringComparer.OrdinalIgnoreCase
                );

                long aiSessions = aiRes.Rows.Sum(r => ParseLong(r.MetricValues[0].Value));

                // Referral in GA4 often includes AI assistants; adjust Referral so there is no double-counting
                long referralSessions = channelSessions.TryGetValue("Referral", out var refSess) ? refSess : 0;
                referralSessions = Math.Max(0, referralSessions - aiSessions);

                var requiredChannels = new[]
                {
                    "Direct",
                    "Organic Search",
                    "Referral",
                    "Organic Social",
                    "Paid Social",
                    "AI Assistant",
                    "Unassigned"
                };

                var channels = new List<SessionChannel>();
                foreach (var channelName in requiredChannels)
                {
                    long count = 0;
                    if (channelName == "AI Assistant")
                    {
                        count = aiSessions;
                    }
                    else if (channelName == "Referral")
                    {
                        count = referralSessions;
                    }
                    else if (channelSessions.TryGetValue(channelName, out var sess))
                    {
                        count = sess;
                    }

                    channels.Add(new SessionChannel
                    {
                        Channel = channelName,
                        Sessions = count,
                    });
                }

                // Add any other channel groupings returned by GA (e.g. Paid Search, Email) if > 0
                foreach (var kvp in channelSessions)
                {
                    if (!requiredChannels.Contains(kvp.Key, StringComparer.OrdinalIgnoreCase) &&
                        !string.Equals(kvp.Key, "Referral", StringComparison.OrdinalIgnoreCase) &&
                        kvp.Value > 0)
                    {
                        channels.Add(new SessionChannel
                        {
                            Channel = kvp.Key,
                            Sessions = kvp.Value,
                        });
                    }
                }

                var totalSessions = channels.Sum(c => c.Sessions);
                foreach (var ch in channels)
                {
                    ch.Percentage = totalSessions > 0 ? Math.Round((double)ch.Sessions / totalSessions * 100, 1) : 0;
                }

                return new SessionChannelReport
                {
                    Channels = channels,
                    TotalSessions = totalSessions,
                };
            });

        public Task<AnalyticsResult<List<TrafficSource>>> GetTopTrafficSourcesAsync(VisitorDateRange range, int? top)
        {
            var limit = top is > 0 ? Math.Min(top.Value, 100) : 10;
            return CachedAsync(range, $"trafficSources:{limit}", async client =>
            {
                var request = NewRequest(range);
                request.Dimensions.Add(new Dimension { Name = "sessionSource" });
                request.Dimensions.Add(new Dimension { Name = "sessionMedium" });
                request.Metrics.Add(new Metric { Name = "sessions" });
                request.Metrics.Add(new Metric { Name = "activeUsers" });
                request.OrderBys.Add(new OrderBy { Metric = new OrderBy.Types.MetricOrderBy { MetricName = "sessions" }, Desc = true });
                request.Limit = limit;

                var response = await client.RunReportAsync(request);
                return response.Rows.Select(r => new TrafficSource
                {
                    Source = ParseString(r.DimensionValues[0].Value) is var s && string.IsNullOrEmpty(s) ? "(direct)" : s,
                    Medium = ParseString(r.DimensionValues[1].Value) is var m && string.IsNullOrEmpty(m) ? "(none)" : m,
                    Sessions = ParseLong(r.MetricValues[0].Value),
                    ActiveUsers = ParseLong(r.MetricValues[1].Value),
                }).ToList();
            });
        }

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
                var isToday = range.GaDay == "today";
                var lastHour = isToday ? NowIst().Hour : 23;
                // Today: GA standard reports lag a few hours behind (Realtime does not). Hours after the
                // last hour GA returned are not processed yet, so they are marked Pending instead of 0.
                var lastProcessedHour = byHour.Count > 0 ? byHour.Keys.Max() : -1;
                return Enumerable.Range(0, lastHour + 1)
                    .Select(h => new VisitorHour
                    {
                        Hour = h,
                        ActiveUsers = byHour.TryGetValue(h, out var users) ? users : 0,
                        Pending = isToday && h > lastProcessedHour,
                    })
                    .ToList();
            });

        public Task<AnalyticsResult<List<VisitorPage>>> GetPagesAsync(VisitorDateRange range, int? top)
        {
            var limit = top is > 0 ? Math.Min(top.Value, MaxPageRows) : MaxPageRows;
            return CachedAsync(range, $"pages:{limit}", async client =>
            {
                var request = NewRequest(range);
                request.Dimensions.Add(new Dimension { Name = "pagePath" });
                request.Dimensions.Add(new Dimension { Name = "pageTitle" });
                request.Metrics.Add(new Metric { Name = "screenPageViews" });
                request.Metrics.Add(new Metric { Name = "activeUsers" });
                request.Metrics.Add(new Metric { Name = "userEngagementDuration" });
                request.OrderBys.Add(new OrderBy { Metric = new OrderBy.Types.MetricOrderBy { MetricName = "screenPageViews" }, Desc = true });
                request.Limit = limit;

                var response = await client.RunReportAsync(request);
                return response.Rows.Select(r =>
                {
                    var views = ParseLong(r.MetricValues[0].Value);
                    var users = ParseLong(r.MetricValues[1].Value);
                    var durationSec = ParseDouble(r.MetricValues[2].Value);
                    var avgEng = users > 0 ? durationSec / users : 0;
                    return new VisitorPage
                    {
                        PagePath = ParseString(r.DimensionValues[0].Value),
                        PageTitle = ParseString(r.DimensionValues[1].Value) is var title && string.IsNullOrEmpty(title) ? "(untitled)" : title,
                        Views = views,
                        ActiveUsers = users,
                        AverageEngagementTimeSeconds = avgEng,
                    };
                }).ToList();
            });
        }

        public Task<AnalyticsResult<GeoReport>> GetGeoReportAsync(VisitorDateRange range, int? top)
        {
            var limit = top is > 0 ? Math.Min(top.Value, 50) : 10;
            return CachedAsync(range, $"geo:{limit}", async client =>
            {
                var countryReq = NewRequest(range);
                countryReq.Dimensions.Add(new Dimension { Name = "country" });
                countryReq.Metrics.Add(new Metric { Name = "activeUsers" });
                countryReq.OrderBys.Add(new OrderBy { Metric = new OrderBy.Types.MetricOrderBy { MetricName = "activeUsers" }, Desc = true });
                countryReq.Limit = limit;

                var cityReq = NewRequest(range);
                cityReq.Dimensions.Add(new Dimension { Name = "city" });
                cityReq.Metrics.Add(new Metric { Name = "activeUsers" });
                cityReq.OrderBys.Add(new OrderBy { Metric = new OrderBy.Types.MetricOrderBy { MetricName = "activeUsers" }, Desc = true });
                cityReq.Limit = limit;

                var countryTask = client.RunReportAsync(countryReq);
                var cityTask = client.RunReportAsync(cityReq);
                await System.Threading.Tasks.Task.WhenAll(countryTask, cityTask);

                var countryRes = await countryTask;
                var cityRes = await cityTask;

                return new GeoReport
                {
                    Countries = countryRes.Rows.Select(r => new GeoLocationItem
                    {
                        Name = ParseString(r.DimensionValues[0].Value) is var c && string.IsNullOrEmpty(c) ? "(not set)" : c,
                        ActiveUsers = ParseLong(r.MetricValues[0].Value),
                    }).ToList(),
                    Cities = cityRes.Rows.Select(r => new GeoLocationItem
                    {
                        Name = ParseString(r.DimensionValues[0].Value) is var c && string.IsNullOrEmpty(c) ? "(not set)" : c,
                        ActiveUsers = ParseLong(r.MetricValues[0].Value),
                    }).ToList(),
                };
            });
        }

        public Task<AnalyticsResult<DeviceReport>> GetDeviceReportAsync(VisitorDateRange range) =>
            CachedAsync(range, "devices", async client =>
            {
                var request = NewRequest(range);
                request.Dimensions.Add(new Dimension { Name = "deviceCategory" });
                request.Metrics.Add(new Metric { Name = "activeUsers" });

                var response = await client.RunReportAsync(request);
                var dict = response.Rows.ToDictionary(
                    r => ParseString(r.DimensionValues[0].Value),
                    r => ParseLong(r.MetricValues[0].Value),
                    StringComparer.OrdinalIgnoreCase
                );

                // Desktop, Mobile, Tablet with users and percentage. Show Tablet as 0 if GA4 returns nothing.
                var targetCategories = new[] { "Desktop", "Mobile", "Tablet" };
                var list = new List<DeviceCategoryItem>();
                foreach (var cat in targetCategories)
                {
                    list.Add(new DeviceCategoryItem
                    {
                        Category = cat,
                        ActiveUsers = dict.TryGetValue(cat, out var u) ? u : 0,
                    });
                }

                foreach (var kvp in dict)
                {
                    if (!targetCategories.Contains(kvp.Key, StringComparer.OrdinalIgnoreCase) && kvp.Value > 0)
                    {
                        list.Add(new DeviceCategoryItem
                        {
                            Category = kvp.Key,
                            ActiveUsers = kvp.Value,
                        });
                    }
                }

                var total = list.Sum(c => c.ActiveUsers);
                foreach (var item in list)
                {
                    item.Percentage = total > 0 ? Math.Round((double)item.ActiveUsers / total * 100, 1) : 0;
                }

                return new DeviceReport
                {
                    Categories = list,
                    TotalUsers = total,
                };
            });

        // AI assistants and the session sources (referrer / utm_source) GA records for their links.
        private static readonly (string Tool, string[] Sources)[] AiTools =
        {
            ("ChatGPT", new[] { "chatgpt.com", "chat.openai.com" }),
            ("Perplexity", new[] { "perplexity.ai", "www.perplexity.ai" }),
            ("Gemini", new[] { "gemini.google.com", "bard.google.com" }),
            ("Copilot", new[] { "copilot.microsoft.com" }),
            ("Claude", new[] { "claude.ai" }),
        };

        public Task<AnalyticsResult<AiReferralReport>> GetAiReferralsAsync(VisitorDateRange range) =>
            CachedAsync(range, "ai-referrals", async client =>
            {
                var sources = AiTools.SelectMany(t => t.Sources).ToList();
                RunReportRequest Request(bool bySource)
                {
                    var request = NewRequest(range);
                    var sourceFilter = new FilterExpression
                    {
                        Filter = new Filter
                        {
                            FieldName = "sessionSource",
                            InListFilter = new Filter.Types.InListFilter { CaseSensitive = false, Values = { sources } },
                        },
                    };
                    // Keep the HiyaGhar stream filter AND add the AI sources.
                    request.DimensionFilter = new FilterExpression
                    {
                        AndGroup = new FilterExpressionList { Expressions = { request.DimensionFilter, sourceFilter } },
                    };
                    if (bySource) request.Dimensions.Add(new Dimension { Name = "sessionSource" });
                    request.Metrics.Add(new Metric { Name = "sessions" });
                    request.Metrics.Add(new Metric { Name = "activeUsers" });
                    return request;
                }

                var bySource = await client.RunReportAsync(Request(true));
                var totals = await client.RunReportAsync(Request(false)); // users counted once overall
                var rows = bySource.Rows.Select(r => (Source: r.DimensionValues[0].Value.ToLowerInvariant(),
                    Sessions: ParseLong(r.MetricValues[0].Value), Users: ParseLong(r.MetricValues[1].Value))).ToList();
                var total = totals.Rows.FirstOrDefault();

                return new AiReferralReport
                {
                    Tools = AiTools.Select(t =>
                    {
                        var mine = rows.Where(r => t.Sources.Contains(r.Source)).ToList();
                        return new AiReferral { Tool = t.Tool, Sessions = mine.Sum(r => r.Sessions), ActiveUsers = mine.Sum(r => r.Users) };
                    }).ToList(),
                    TotalSessions = total == null ? 0 : ParseLong(total.MetricValues[0].Value),
                    TotalUsers = total == null ? 0 : ParseLong(total.MetricValues[1].Value),
                };
            });

        public Task<AnalyticsResult<RealtimeReport>> GetRealtimeAsync() =>
            CachedQueryAsync("realtime", RealtimeCacheDuration, async client =>
            {
                RunRealtimeReportRequest Request(string? dimension, int minutes, int limit = 0)
                {
                    var request = new RunRealtimeReportRequest
                    {
                        Property = $"properties/{_settings.PropertyId.Trim()}",
                        DimensionFilter = StreamFilter(),
                        MinuteRanges = { new MinuteRange { StartMinutesAgo = minutes - 1, EndMinutesAgo = 0 } },
                    };
                    if (dimension != null)
                    {
                        request.Dimensions.Add(new Dimension { Name = dimension });
                        request.OrderBys.Add(new OrderBy { Metric = new OrderBy.Types.MetricOrderBy { MetricName = "activeUsers" }, Desc = true });
                    }
                    request.Metrics.Add(new Metric { Name = "activeUsers" });
                    if (limit > 0) request.Limit = limit;
                    return request;
                }

                var totalsRequest = Request(null, 30);
                totalsRequest.Metrics.Add(new Metric { Name = "screenPageViews" });

                var totalsTask = client.RunRealtimeReportAsync(totalsRequest);
                var last5Task = client.RunRealtimeReportAsync(Request(null, 5));
                var minutesTask = client.RunRealtimeReportAsync(Request("minutesAgo", 30));
                var pagesTask = client.RunRealtimeReportAsync(Request("unifiedScreenName", 30, 10));
                var countriesTask = client.RunRealtimeReportAsync(Request("country", 30, 10));
                var citiesTask = client.RunRealtimeReportAsync(Request("city", 30, 10));
                var devicesTask = client.RunRealtimeReportAsync(Request("deviceCategory", 30));
                await Task.WhenAll(totalsTask, last5Task, minutesTask, pagesTask, countriesTask, citiesTask, devicesTask);

                static List<RealtimeItem> Items(RunRealtimeReportResponse r) => r.Rows
                    .Select(row => new RealtimeItem
                    {
                        Name = string.IsNullOrWhiteSpace(row.DimensionValues[0].Value) ? "(not set)" : row.DimensionValues[0].Value.Trim(),
                        ActiveUsers = ParseLong(row.MetricValues[0].Value),
                    })
                    .ToList();

                // minutesAgo comes back as "00".."29"; minutes without visitors have no row.
                var byMinute = minutesTask.Result.Rows
                    .GroupBy(r => (int)ParseLong(r.DimensionValues[0].Value))
                    .ToDictionary(g => g.Key, g => g.Sum(r => ParseLong(r.MetricValues[0].Value)));
                var totals = totalsTask.Result.Rows.FirstOrDefault();
                var last5 = last5Task.Result.Rows.FirstOrDefault();

                return new RealtimeReport
                {
                    ActiveUsers30Min = totals == null ? 0 : ParseLong(totals.MetricValues[0].Value),
                    PageViews30Min = totals == null ? 0 : ParseLong(totals.MetricValues[1].Value),
                    ActiveUsers5Min = last5 == null ? 0 : ParseLong(last5.MetricValues[0].Value),
                    PerMinute = Enumerable.Range(0, 30).Select(i => byMinute.TryGetValue(29 - i, out var u) ? u : 0).ToList(),
                    Pages = Items(pagesTask.Result),
                    Countries = Items(countriesTask.Result),
                    Cities = Items(citiesTask.Result),
                    Devices = Items(devicesTask.Result)
                        .Select(d => new RealtimeItem { Name = CultureInfo.InvariantCulture.TextInfo.ToTitleCase(d.Name), ActiveUsers = d.ActiveUsers })
                        .ToList(),
                    FetchedAtUtc = DateTime.UtcNow,
                };
            });

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
            DimensionFilter = StreamFilter(),
        };

        // Only the HiyaGhar web stream (the GA property also holds another website).
        private FilterExpression StreamFilter() => new()
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
        };

        private static long ParseLong(string value) =>
            long.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var n) ? n : 0;

        private static string ParseString(string value) =>
            string.IsNullOrWhiteSpace(value) ? "" : value.Trim();

        private static double ParseDouble(string value) =>
            double.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out var n) ? n : 0;

        private async Task<AnalyticsResult<T>> CachedAsync<T>(VisitorDateRange range, string kind, Func<BetaAnalyticsDataClient, Task<T>> query)
        {
            // The key holds the real dates, so after midnight "today" never returns yesterday's numbers.
            var key = $"{kind}:{range.GaDay ?? "dates"}:{range.StartDate:yyyyMMdd}:{range.EndDate:yyyyMMdd}";
            var cacheDuration = range.GaDay == "today" ? TodayCacheDuration : CacheDuration;
            return await CachedQueryAsync(key, cacheDuration, query);
        }

        private async Task<AnalyticsResult<T>> CachedQueryAsync<T>(string key, TimeSpan cacheDuration, Func<BetaAnalyticsDataClient, Task<T>> query)
        {
            var cacheKey = "ga4:" + key;
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

                var keyPath = KeyFilePathFull;

                // The file is read here (not by the Google library) so the log can say exactly
                // why it failed. The key's contents are never logged.
                string keyJson;
                try
                {
                    keyJson = File.ReadAllText(keyPath);
                }
                catch (Exception ex) when (ex is FileNotFoundException or DirectoryNotFoundException)
                {
                    _logger.LogError("Google Analytics key file NOT FOUND. Checked full path: '{KeyFilePath}' (setting GoogleAnalytics:KeyFilePath = '{Configured}', app folder = '{ContentRoot}').",
                        keyPath, _settings.KeyFilePath, _contentRootPath);
                    return AnalyticsResult<BetaAnalyticsDataClient>.Fail("Website analytics is not configured on the server: the Google key file was not found.");
                }
                catch (UnauthorizedAccessException)
                {
                    _logger.LogError("Google Analytics key file ACCESS DENIED. Checked full path: '{KeyFilePath}'. The website's user (IIS application pool) needs read permission on this file and its folder.",
                        keyPath);
                    return AnalyticsResult<BetaAnalyticsDataClient>.Fail("Website analytics is not configured on the server: the Google key file cannot be read (access denied).");
                }
                catch (Exception ex)
                {
                    _logger.LogError("Google Analytics key file could not be read ({ErrorType}: {ErrorMessage}). Checked full path: '{KeyFilePath}'.",
                        ex.GetType().Name, ex.Message, keyPath);
                    return AnalyticsResult<BetaAnalyticsDataClient>.Fail("Website analytics is not configured on the server: the Google key file cannot be read.");
                }

                try
                {
                    var credential = CredentialFactory.FromJson<ServiceAccountCredential>(keyJson).ToGoogleCredential();
                    _client = new BetaAnalyticsDataClientBuilder { GoogleCredential = credential }.Build();
                    return AnalyticsResult<BetaAnalyticsDataClient>.Ok(_client);
                }
                catch (Exception ex)
                {
                    // Only the error type: a JSON parser message can quote part of the file.
                    _logger.LogError("Google Analytics key file INVALID: it is not a valid service account JSON key ({ErrorType}). Checked full path: '{KeyFilePath}'.",
                        ex.GetType().Name, keyPath);
                    return AnalyticsResult<BetaAnalyticsDataClient>.Fail("Website analytics is not configured correctly: the Google key file is not a valid service account key.");
                }
            }
        }

        // GoogleAnalytics:KeyFilePath as a full path. Absolute paths (F:\Secrets\...) are used as they
        // are; relative ones (..\Secrets\...) are resolved from the app folder (ContentRootPath), which
        // on the live server is the hiyaghar.com folder.
        private string KeyFilePathFull
        {
            get
            {
                var configured = _settings.KeyFilePath.Trim();
                return Path.GetFullPath(Path.IsPathRooted(configured) ? configured : Path.Combine(_contentRootPath, configured));
            }
        }

        // Called once at startup: logs whether the key file can be used, so a wrong path or missing
        // permission shows up in the log straight away. Never throws.
        public void LogStartupStatus(string environmentName)
        {
            try
            {
                var client = GetClient(); // logs the exact problem itself when it fails
                if (client.IsSuccess)
                {
                    _logger.LogInformation("Google Analytics ready (environment {Environment}): key file OK at '{KeyFilePath}', property {PropertyId}, stream {StreamId}.",
                        environmentName, KeyFilePathFull, _settings.PropertyId, _settings.StreamId);
                }
                else
                {
                    _logger.LogWarning("Google Analytics NOT available (environment {Environment}); the Website Visitors section will show an error. The rest of the admin panel is not affected.",
                        environmentName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError("Google Analytics startup check failed ({ErrorType}).", ex.GetType().Name);
            }
        }
    }
}
