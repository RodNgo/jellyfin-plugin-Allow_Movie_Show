# Release Prep (v1.0.3.1)

## Artifact

- DLL: `dist/Jellyfin.Plugin.AllowMovieShow.dll`
- ZIP (upload this to release): `release/Jellyfin.Plugin.AllowMovieShow_1.0.3.1.zip`
- MD5 (manifest checksum): `d1f4af2be2ffdd31a6a517ffeacd30d7`
- SHA256 (reference): `4626c9b9b4038f5faba77d6b9742e2c7130eafffbbe905f4364005e691349790`

## Manifest updated

- File: `manifest.json`
- Version: `1.0.3.1`
- Target ABI: `10.11.0.0`
- Source URL:
  `https://github.com/RodNgo/jellyfin-plugin-Allow_Movie_Show/releases/download/v1.0.3.1/Jellyfin.Plugin.AllowMovieShow_1.0.3.1.zip`

## GitHub Release checklist

1. Create and push tag:

```bash
git tag v1.0.3.1
git push origin v1.0.3.1
```

2. Create GitHub Release for tag `v1.0.3.1`.
3. Upload asset:
   - `release/Jellyfin.Plugin.AllowMovieShow_1.0.3.1.zip`
4. Ensure release asset filename exactly matches:
   - `Jellyfin.Plugin.AllowMovieShow_1.0.3.1.zip`
5. Push commit that contains updated `manifest.json`.

## Jellyfin repository URL

Add this URL in Jellyfin `Manage Repositories`:

`https://raw.githubusercontent.com/RodNgo/jellyfin-plugin-Allow_Movie_Show/main/manifest.json`
