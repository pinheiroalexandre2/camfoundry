# Roadmap

- **Encrypt stored credentials** — camera passwords are plaintext in
   `cameras.json`; move to Electron `safeStorage` (OS keychain).
- **Surface discovery errors** — `discoverCameras` swallows errors and returns
   an empty list; "failed" and "none found" look identical in the UI.
- **Stream auto-reconnect** — restart ffmpeg when it exits; detect frozen streams.
- **Clearer errors** — distinguish auth failure from unreachable host; validate
   host / RTSP URL input.
- **Storage schema version** — add a `version` field + migration shim to
   `cameras.json`.
- **Open logs folder** — Help menu item via `shell.openPath(app.getPath('logs'))`.

## Distribution

- Apple Developer ID signing + notarization (certs via env vars; unsigned today).
- Windows code signing certificate.
