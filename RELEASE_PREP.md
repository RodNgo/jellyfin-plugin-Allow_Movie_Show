# Release Prep (v1.0.3.2)

## Artifact

- DLL: `dist/Jellyfin.Plugin.AllowMovieShow.dll`
- ZIP (upload this to release): `release/Jellyfin.Plugin.AllowMovieShow_1.0.3.2.zip`
- MD5 (manifest checksum): `672ed97e61ec540819468c36c2fb8b88`
- SHA256 (reference): `8462e0ed940c17cefe368dbd6de569c4ed7284ea06a449034d82e5c1e2bd2a7b`

## Manifest updated

- File: `manifest.json`
- Version: `1.0.3.2`
- Target ABI: `10.11.0.0`
- Source URL:
  `https://github.com/RodNgo/jellyfin-plugin-Allow_Movie_Show/releases/download/v1.0.3.2/Jellyfin.Plugin.AllowMovieShow_1.0.3.2.zip`

## GitHub Release checklist

1. Create and push tag:

```bash
git tag v1.0.3.2
git push origin v1.0.3.2
```

2. Create GitHub Release for tag `v1.0.3.2`.
3. Upload asset:
   - `release/Jellyfin.Plugin.AllowMovieShow_1.0.3.2.zip`
4. Ensure release asset filename exactly matches:
   - `Jellyfin.Plugin.AllowMovieShow_1.0.3.2.zip`
5. Push commit that contains updated `manifest.json`.

## Jellyfin repository URL

Add this URL in Jellyfin `Manage Repositories`:

`https://raw.githubusercontent.com/RodNgo/jellyfin-plugin-Allow_Movie_Show/main/manifest.json`
