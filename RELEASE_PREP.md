# Release Prep (v1.0.4.0)

## Artifact

- DLL: `dist/Jellyfin.Plugin.AllowMovieShow.dll`
- ZIP (upload this to release): `release/Jellyfin.Plugin.AllowMovieShow_1.0.4.0.zip`
- MD5 (manifest checksum): `e6431ca5901fd32f13cc637ec6acf9a1`
- SHA256 (reference): `f8d748ee41ccb47f293483f815c633059e22408576d3dc9539e7d9a9c9abaf1f`

## Manifest updated

- File: `manifest.json`
- Version: `1.0.4.0`
- Target ABI: `10.11.0.0`
- Source URL:
  `https://github.com/RodNgo/jellyfin-plugin-Allow_Movie_Show/releases/download/v1.0.4.0/Jellyfin.Plugin.AllowMovieShow_1.0.4.0.zip`

## GitHub Release checklist

1. Create and push tag:

```bash
git tag v1.0.4.0
git push origin v1.0.4.0
```

2. Create GitHub Release for tag `v1.0.4.0`.
3. Upload asset:
   - `release/Jellyfin.Plugin.AllowMovieShow_1.0.4.0.zip`
4. Ensure release asset filename exactly matches:
   - `Jellyfin.Plugin.AllowMovieShow_1.0.4.0.zip`
5. Push commit that contains updated `manifest.json`.

## Jellyfin repository URL

Add this URL in Jellyfin `Manage Repositories`:

`https://raw.githubusercontent.com/RodNgo/jellyfin-plugin-Allow_Movie_Show/main/manifest.json`
