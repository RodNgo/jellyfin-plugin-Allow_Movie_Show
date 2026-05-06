namespace Jellyfin.Plugin.AllowMovieShow.Configuration;

public sealed class UserDashboardRule
{
    public string UserId { get; set; } = string.Empty;

    public string UserName { get; set; } = string.Empty;

    public string[] HiddenItemIds { get; set; } = [];
}
