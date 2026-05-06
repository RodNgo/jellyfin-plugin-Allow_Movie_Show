using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Jellyfin.Plugin.AllowMovieShow.Services;
using MediaBrowser.Controller.Library;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AllowMovieShow.Api;

[Route("AllowMovieShowApi")]
[ApiController]
public class AllowMovieShowController : ControllerBase
{
    private readonly DashboardVisibilityService _dashboardVisibilityService;
    private readonly ILibraryManager _libraryManager;
    private readonly ILogger<AllowMovieShowController> _logger;

    public AllowMovieShowController(
        IUserManager userManager,
        ILibraryManager libraryManager,
        ILogger<AllowMovieShowController> logger,
        ILogger<DashboardVisibilityService> visibilityLogger)
    {
        _dashboardVisibilityService = new DashboardVisibilityService(userManager, libraryManager, visibilityLogger);
        _libraryManager = libraryManager;
        _logger = logger;
    }

    [HttpPost("ApplyNow")]
    public async Task<ActionResult<string>> ApplyNow()
    {
        await _dashboardVisibilityService.ApplyRulesAsync(Plugin.Instance!.Configuration).ConfigureAwait(false);
        return Ok("Rules applied successfully.");
    }

    [HttpGet("ResolveItems")]
    public ActionResult<IEnumerable<ItemLookupResult>> ResolveItems([FromQuery] string ids)
    {
        if (string.IsNullOrWhiteSpace(ids))
        {
            return Ok(Array.Empty<ItemLookupResult>());
        }

        var results = new List<ItemLookupResult>();
        foreach (var id in ids.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (!Guid.TryParse(id, out var guid))
            {
                continue;
            }

            var item = _libraryManager.GetItemById(guid);
            if (item is null)
            {
                continue;
            }

            var type = item.GetType().Name;
            if (!type.Equals("Movie", StringComparison.OrdinalIgnoreCase) && !type.Equals("Series", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            results.Add(new ItemLookupResult
            {
                Id = item.Id.ToString(),
                Name = item.Name,
                Type = type
            });
        }

        _logger.LogDebug("Resolved {Count} item(s).", results.Count);
        return Ok(results);
    }
}

public sealed class ItemLookupResult
{
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;
}
