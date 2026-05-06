using System;
using System.Collections.Generic;
using System.Globalization;
using Jellyfin.Plugin.AllowMovieShow.Configuration;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.AllowMovieShow;

public sealed class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages
{
    private readonly ILogger<Plugin> _logger;

    public Plugin(IApplicationPaths applicationPaths, IXmlSerializer xmlSerializer, ILogger<Plugin> logger)
        : base(applicationPaths, xmlSerializer)
    {
        _logger = logger;
        Instance = this;
    }

    public static Plugin? Instance { get; private set; }

    public static ILogger<Plugin> Logger => Instance!._logger;

    public override string Name => "Allow Movie Show";

    public override Guid Id => Guid.Parse("4ce5e570-aeba-4218-a0f8-741cd5701ec6");

    public IEnumerable<PluginPageInfo> GetPages()
    {
        yield return new PluginPageInfo
        {
            Name = Name,
            EmbeddedResourcePath = string.Format(CultureInfo.InvariantCulture, "{0}.Configuration.Web.configPage.html", GetType().Namespace)
        };

        yield return new PluginPageInfo
        {
            Name = $"{Name}.js",
            EmbeddedResourcePath = string.Format(CultureInfo.InvariantCulture, "{0}.Configuration.Web.configPage.js", GetType().Namespace)
        };
    }
}
