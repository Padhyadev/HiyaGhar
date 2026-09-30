using Hiya2.Server.Repositories.Stock;

namespace Hiya2.Server.Services
{
    /// <summary>
    /// Periodically releases cart stock reservations that have passed their ExpiresAt time,
    /// so abandoned carts don't hold inventory hostage forever. See implementation plan §8 for
    /// why a plain BackgroundService (not Hangfire/Quartz) is the right fit here: this app runs
    /// as a single instance and the job is a trivial periodic sweep - no persistence, retry,
    /// dashboard, or multi-instance coordination is needed.
    /// </summary>
    public class ReservationExpiryService : BackgroundService
    {
        private static readonly TimeSpan SweepInterval = TimeSpan.FromMinutes(2);
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<ReservationExpiryService> _logger;

        public ReservationExpiryService(IServiceScopeFactory scopeFactory, ILogger<ReservationExpiryService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var stockService = scope.ServiceProvider.GetRequiredService<IStockService>();
                    var released = await stockService.ReleaseExpiredReservationsAsync();
                    if (released > 0)
                    {
                        _logger.LogInformation("ReservationExpiryService released {Count} expired stock reservation(s).", released);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "ReservationExpiryService sweep failed.");
                }

                try
                {
                    await Task.Delay(SweepInterval, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    // Expected on shutdown.
                }
            }
        }
    }
}
