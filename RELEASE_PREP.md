# Release Prep (v1.0.2.0)

## Artifact

- DLL: `dist/Jellyfin.Plugin.AllowMovieShow.dll`
- ZIP (upload this to release): `release/Jellyfin.Plugin.AllowMovieShow_1.0.2.0.zip`
- MD5 (manifest checksum): `035ab22e161190f56fcba99be26528ac`
- SHA256 (reference): `5d0aedd4ac9f045fda516781150c6e116b492aea33de22f52f2ad70d7175d36f`

## Manifest updated

- File: `manifest.json`
- Version: `1.0.2.0`
- Target ABI: `10.11.0.0`
- Source URL:
  `https://github.com/RodNgo/jellyfin-plugin-Allow_Movie_Show/releases/download/v1.0.2.0/Jellyfin.Plugin.AllowMovieShow_1.0.2.0.zip`

## GitHub Release checklist

1. Create and push tag:

```bash
git tag v1.0.2.0
git push origin v1.0.2.0
```

2. Create GitHub Release for tag `v1.0.2.0`.
3. Upload asset:
   - `release/Jellyfin.Plugin.AllowMovieShow_1.0.2.0.zip`
4. Ensure release asset filename exactly matches:
   - `Jellyfin.Plugin.AllowMovieShow_1.0.2.0.zip`
5. Push commit that contains updated `manifest.json`.

## Jellyfin repository URL

Add this URL in Jellyfin `Manage Repositories`:

`https://raw.githubusercontent.com/RodNgo/jellyfin-plugin-Allow_Movie_Show/main/manifest.json`
