# Release Prep (v1.0.1.0)

## Artifact

- File: `dist/Jellyfin.Plugin.AllowMovieShow.dll`
- SHA256: `ddbca67cf80be1f42b302a425bc934fe92d712b0bca0f684b977df479e47202e`

## Manifest updated

- File: `manifest.json`
- Version: `1.0.1.0`
- Target ABI: `10.11.0.0`
- Source URL:
  `https://github.com/RodNgo/jellyfin-plugin-Allow_Movie_Show/releases/download/v1.0.1.0/Jellyfin.Plugin.AllowMovieShow.dll`

## GitHub Release checklist

1. Create and push tag:

```bash
git tag v1.0.1.0
git push origin v1.0.1.0
```

2. Create GitHub Release for tag `v1.0.1.0`.
3. Upload asset:
   - `dist/Jellyfin.Plugin.AllowMovieShow.dll`
4. Ensure release asset filename exactly matches:
   - `Jellyfin.Plugin.AllowMovieShow.dll`
5. Push commit that contains updated `manifest.json`.

## Jellyfin repository URL

Add this URL in Jellyfin `Manage Repositories`:

`https://raw.githubusercontent.com/RodNgo/jellyfin-plugin-Allow_Movie_Show/main/manifest.json`
