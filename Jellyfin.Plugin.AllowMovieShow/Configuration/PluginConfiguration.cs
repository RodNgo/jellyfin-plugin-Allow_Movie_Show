using System;
using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.AllowMovieShow.Configuration;

public sealed class PluginConfiguration : BasePluginConfiguration
{
    public PluginConfiguration()
    {
        EnablePlugin = true;
        UserRules = Array.Empty<UserDashboardRule>();
    }

    public bool EnablePlugin { get; set; }

    public UserDashboardRule[] UserRules { get; set; }
}
