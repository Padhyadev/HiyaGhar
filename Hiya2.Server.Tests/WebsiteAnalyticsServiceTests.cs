using System.Text.Json;
using Hiya2.Server.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace Hiya2.Server.Tests;

public class MockHostEnv : IHostEnvironment
{
    public string EnvironmentName { get; set; } = "Development";
    public string ApplicationName { get; set; } = "Hiya2.Server";
    public string ContentRootPath { get; set; } = @"F:\1.Vishal_Gami_Project\HiyaGhar\Hiya2.Server";
    public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } = null!;
}

public class WebsiteAnalyticsServiceTests
{
    private readonly GoogleAnalyticsService _service;

    public WebsiteAnalyticsServiceTests()
    {
        var settings = Options.Create(new GoogleAnalyticsSettings
        {
            PropertyId = "499064515",
            StreamId = "16228991243",
            KeyFilePath = @"F:\Secrets\hiyaghar-ga-key.json"
        });

        var cache = new MemoryCache(new MemoryCacheOptions());
        var logger = NullLogger<GoogleAnalyticsService>.Instance;
        var env = new MockHostEnv();

        _service = new GoogleAnalyticsService(settings, cache, logger, env);
    }

    [Fact]
    public async Task Can_Fetch_Yesterday_Analytics_From_GA4()
    {
        var rangeResult = _service.ResolveRange("yesterday", null, null);
        Assert.True(rangeResult.IsSuccess);
        Assert.NotNull(rangeResult.Data);

        // 1. Extended summary with previous
        var summaryResult = await _service.GetAllMetricsWithPreviousPeriodAsync(rangeResult.Data);
        Assert.True(summaryResult.IsSuccess, summaryResult.Message);
        Assert.NotNull(summaryResult.Data);

        // 2. Session channels
        var channelsResult = await _service.GetSessionChannelsAsync(rangeResult.Data);
        Assert.True(channelsResult.IsSuccess, channelsResult.Message);
        Assert.NotNull(channelsResult.Data);
        Assert.Contains(channelsResult.Data.Channels, c => c.Channel == "Direct");
        Assert.Contains(channelsResult.Data.Channels, c => c.Channel == "AI Assistant");

        // 3. Top sources
        var sourcesResult = await _service.GetTopTrafficSourcesAsync(rangeResult.Data, 10);
        Assert.True(sourcesResult.IsSuccess, sourcesResult.Message);
        Assert.NotNull(sourcesResult.Data);

        // 4. Geo
        var geoResult = await _service.GetGeoReportAsync(rangeResult.Data, 10);
        Assert.True(geoResult.IsSuccess, geoResult.Message);
        Assert.NotNull(geoResult.Data);

        // 5. Devices
        var deviceResult = await _service.GetDeviceReportAsync(rangeResult.Data);
        Assert.True(deviceResult.IsSuccess, deviceResult.Message);
        Assert.NotNull(deviceResult.Data);
        Assert.Contains(deviceResult.Data.Categories, d => d.Category == "Tablet");

        // 6. Pages
        var pagesResult = await _service.GetPagesAsync(rangeResult.Data, 10);
        Assert.True(pagesResult.IsSuccess, pagesResult.Message);
        Assert.NotNull(pagesResult.Data);
    }

    [Fact]
    public async Task Can_Fetch_Realtime_From_GA4()
    {
        var realtimeResult = await _service.GetRealtimeAsync();
        Assert.True(realtimeResult.IsSuccess, realtimeResult.Message ?? "Failed without message");
        Assert.NotNull(realtimeResult.Data);
    }
}
