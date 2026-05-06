# Process: Implement item-level visibility per user

This document describes the corrected implementation based on your clarified requirement:

- Keep folder/library access unchanged.
- Hide/show specific Movie/Series items per user (admin-controlled).

Reference style repository:
- [RodNgo/jellyfin-plugin-TelegramNotifier](https://github.com/RodNgo/jellyfin-plugin-TelegramNotifier)

## 1) Requirement correction

Initial draft incorrectly controlled folder-level visibility.  
Updated target is item-level visibility:

- User still has access to the same libraries/folders.
- Admin can hide selected Movie/Series per user.

## 2) Configuration model

Used per-user rule:

- `UserId`
- `UserName`
- `HiddenItemIds` (array of Jellyfin item ids)

Plugin config keeps:

- `EnablePlugin`
- `UserRules`

## 3) Dashboard UI flow

Config page now supports:

1. Select user.
2. Search media (Movie/Series only).
3. Add/remove items from hidden list for that user.
4. Save plugin configuration.
5. Auto-apply right away via `ApplyNow` API (no restart required).
6. Manually trigger `Apply now` button when needed.

To improve UX after reload:
- Hidden item ids are resolved back to display names/types through `ResolveItems` API.

## 4) Core backend logic

Visibility is applied using Jellyfin tag policy:

1. For each user rule, generate deterministic hidden tags from item ids.
2. Preserve non-plugin `BlockedTags`.
3. Replace plugin-managed tags in `BlockedTags` with latest hidden list.
4. Update user policy.
5. Ensure each selected item has its corresponding plugin tag in metadata.

Why this approach:

- `BlockedTags` is per-user and does not remove folder access.
- Gives item-level filtering while keeping library permissions intact.

## 5) Files changed for corrected behavior

- `Jellyfin.Plugin.AllowMovieShow/Api/AllowMovieShowController.cs`
- `Jellyfin.Plugin.AllowMovieShow/Configuration/UserDashboardRule.cs`
- `Jellyfin.Plugin.AllowMovieShow/Services/DashboardVisibilityService.cs`
- `Jellyfin.Plugin.AllowMovieShow/Configuration/Web/configPage.html`
- `Jellyfin.Plugin.AllowMovieShow/Configuration/Web/configPage.js`
- `README.md`
- `PROCESS.md`

## 6) Build and test checklist

1. Build:

```bash
dotnet build Jellyfin.Plugin.AllowMovieShow.sln
```

2. Install plugin DLL into Jellyfin plugins folder.
3. Restart Jellyfin once after installing plugin.
4. In plugin config:
   - select user
   - search and hide 1 movie / 1 series
   - save
5. Click `Apply now` (or rely on auto-apply after save).
6. Verify selected items disappear for that user, while folder remains visible.

## 7) Notes and future hardening

- Add pagination and richer search filters in UI.
- Add validation that selected ids are only Movie/Series before save.
