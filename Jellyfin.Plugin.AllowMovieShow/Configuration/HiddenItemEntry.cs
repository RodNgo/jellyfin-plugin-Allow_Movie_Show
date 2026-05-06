namespace Jellyfin.Plugin.AllowMovieShow.Configuration;

public sealed class HiddenItemEntry
{
    public string ItemId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string ItemType { get; set; } = string.Empty;

    public string LibraryName { get; set; } = string.Empty;
}
