using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Jellyfin.Data;
using Jellyfin.Plugin.AllowMovieShow.Configuration;
using Jellyfin.Database.Implementations.Enums;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Entities;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AllowMovieShow.Services;

public sealed class DashboardVisibilityService
{
    private const string UserTagPrefix = "allowmovieshow-hidden-";
    private readonly IUserManager _userManager;
    private readonly ILibraryManager _libraryManager;
    private readonly ILogger<DashboardVisibilityService> _logger;

    public DashboardVisibilityService(
        IUserManager userManager,
        ILibraryManager libraryManager,
        ILogger<DashboardVisibilityService> logger)
    {
        _userManager = userManager;
        _libraryManager = libraryManager;
        _logger = logger;
    }

    public async Task ApplyRulesAsync(PluginConfiguration config)
    {
        if (!config.EnablePlugin)
        {
            _logger.LogInformation("AllowMovieShow plugin disabled. Skip rule application.");
            return;
        }

        foreach (var rule in config.UserRules)
        {
            if (!Guid.TryParse(rule.UserId, out var userGuid))
            {
                _logger.LogWarning("Invalid user id in configuration: {UserId}", rule.UserId);
                continue;
            }

            var user = _userManager.GetUserById(userGuid);
            if (user is null)
            {
                _logger.LogWarning("User not found for rule: {UserId}", rule.UserId);
                continue;
            }

            var normalizedHiddenIds = rule.HiddenItemIds
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            var newPluginTags = normalizedHiddenIds
                .Select(itemId => BuildTagForItem(itemId))
                .ToArray();

            var currentBlockedTags = user.GetPreferenceValues<string>(PreferenceKind.BlockedTags) ?? Array.Empty<string>();
            var preservedTags = currentBlockedTags
                .Where(x => !x.StartsWith(UserTagPrefix, StringComparison.OrdinalIgnoreCase))
                .ToList();

            preservedTags.AddRange(newPluginTags);
            var finalBlockedTags = preservedTags
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            user.SetPreference(PreferenceKind.BlockedTags, finalBlockedTags);
            await _userManager.UpdateUserAsync(user).ConfigureAwait(false);

            foreach (var itemId in normalizedHiddenIds)
            {
                await EnsureItemHasTagAsync(itemId, BuildTagForItem(itemId)).ConfigureAwait(false);
            }

            _logger.LogInformation(
                "Applied item-level visibility for user {UserName}: HiddenCount={HiddenCount}",
                user.Username,
                normalizedHiddenIds.Length);
        }
    }

    private async Task EnsureItemHasTagAsync(string itemId, string tag)
    {
        if (!Guid.TryParse(itemId, out var itemGuid))
        {
            _logger.LogWarning("Invalid item id in rule: {ItemId}", itemId);
            return;
        }

        var baseItem = _libraryManager.GetItemById(itemGuid);
        if (baseItem is null)
        {
            _logger.LogWarning("Item not found for id: {ItemId}", itemId);
            return;
        }

        var allowedTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "Movie", "Series" };
        if (!allowedTypes.Contains(baseItem.GetType().Name))
        {
            _logger.LogDebug("Skipped non Movie/Series item id: {ItemId}", itemId);
            return;
        }

        var currentTags = baseItem.Tags ?? Array.Empty<string>();
        if (currentTags.Contains(tag, StringComparer.OrdinalIgnoreCase))
        {
            return;
        }

        baseItem.Tags = currentTags.Concat(new[] { tag }).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        await baseItem.UpdateToRepositoryAsync(ItemUpdateType.MetadataEdit, CancellationToken.None).ConfigureAwait(false);
    }

    private static string BuildTagForItem(string itemId)
    {
        return $"{UserTagPrefix}{itemId}";
    }
}
