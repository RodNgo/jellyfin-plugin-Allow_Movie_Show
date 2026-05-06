using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AllowMovieShow.Services;

public sealed class StartupApplyService : IHostedService
{
    private readonly DashboardVisibilityService _dashboardVisibilityService;
    private readonly ILogger<StartupApplyService> _logger;

    public StartupApplyService(DashboardVisibilityService dashboardVisibilityService, ILogger<StartupApplyService> logger)
    {
        _dashboardVisibilityService = dashboardVisibilityService;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("AllowMovieShow startup apply service started.");
        await _dashboardVisibilityService.ApplyRulesAsync(Plugin.Instance!.Configuration).ConfigureAwait(false);
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
