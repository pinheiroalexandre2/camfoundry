# Roadmap

- Encrypt stored credentials (camera passwords are plaintext in `cameras.json`; move to `safeStorage`)
- Surface discovery errors instead of returning an empty list
- Auto-reconnect streams when ffmpeg exits; detect frozen streams
- Distinguish auth failure from unreachable host; validate host/RTSP input
- Add a schema version and migration to `cameras.json`
- Add an "Open logs folder" menu item

## Distribution

- Apple Developer ID signing + notarization
- Windows code signing certificate
