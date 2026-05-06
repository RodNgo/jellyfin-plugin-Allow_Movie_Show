# Release Prep (v1.0.3.0)

## Artifact

- DLL: `dist/Jellyfin.Plugin.AllowMovieShow.dll`
- ZIP (upload this to release): `release/Jellyfin.Plugin.AllowMovieShow_1.0.3.0.zip`
- MD5 (manifest checksum): `d39ba8d32617f09e15733aeb3fd3ff24`
- SHA256 (reference): `9caa7da789112dbb4c7041a34e6fbc9be9580a3e1e9194caa91ca1407733af7c`

## Manifest updated

- File: `manifest.json`
- Version: `1.0.3.0`
- Target ABI: `10.11.0.0`
- Source URL:
  `https://github.com/RodNgo/jellyfin-plugin-Allow_Movie_Show/releases/download/v1.0.3.0/Jellyfin.Plugin.AllowMovieShow_1.0.3.0.zip`

## GitHub Release checklist

1. Create and push tag:

```bash
git tag v1.0.3.0
git push origin v1.0.3.0
```

2. Create GitHub Release for tag `v1.0.3.0`.
3. Upload asset:
   - `release/Jellyfin.Plugin.AllowMovieShow_1.0.3.0.zip`
4. Ensure release asset filename exactly matches:
   - `Jellyfin.Plugin.AllowMovieShow_1.0.3.0.zip`
5. Push commit that contains updated `manifest.json`.

## Jellyfin repository URL

Add this URL in Jellyfin `Manage Repositories`:

`https://raw.githubusercontent.com/RodNgo/jellyfin-plugin-Allow_Movie_Show/main/manifest.json`
