# Release Prep (v1.0.4.1)

## Artifact

- DLL: `dist/Jellyfin.Plugin.AllowMovieShow.dll`
- ZIP (upload this to release): `release/Jellyfin.Plugin.AllowMovieShow_1.0.4.1.zip`
- MD5 (manifest checksum): `5325d45b314cd6a3fec38236af93bdbc`
- SHA256 (reference): `fa5ade7ca5373dd2a961e12a48e761356338946f3d4ca448802372c1c3c6a6b8`

## Manifest updated

- File: `manifest.json`
- Version: `1.0.4.1`
- Target ABI: `10.11.0.0`
- Source URL:
  `https://github.com/RodNgo/jellyfin-plugin-Allow_Movie_Show/releases/download/v1.0.4.1/Jellyfin.Plugin.AllowMovieShow_1.0.4.1.zip`

## GitHub Release checklist

1. Create and push tag:

```bash
git tag v1.0.4.1
git push origin v1.0.4.1
```

2. Create GitHub Release for tag `v1.0.4.1`.
3. Upload asset:
   - `release/Jellyfin.Plugin.AllowMovieShow_1.0.4.1.zip`
4. Ensure release asset filename exactly matches:
   - `Jellyfin.Plugin.AllowMovieShow_1.0.4.1.zip`
5. Push commit that contains updated `manifest.json`.

## Jellyfin repository URL

Add this URL in Jellyfin `Manage Repositories`:

`https://raw.githubusercontent.com/RodNgo/jellyfin-plugin-Allow_Movie_Show/main/manifest.json`
