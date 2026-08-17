# Changelog

All notable changes to CamFoundry are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-17

### Added

- **Start all cameras** button in the sidebar. Cameras that are already live or
  connecting are skipped, so starting everything no longer restarts running streams.
- **Collapsible sidebar**, so the camera area can use the full window width.
- **Drag and drop reordering** of cameras in the grid. Each card has a grip handle,
  and the order is saved and restored across restarts.
- **ONVIF debug log** (View → ONVIF Debug Log) showing discovery probes and matches,
  device connections, profiles, stream URI responses, and PTZ capabilities.
- **HTTPS support for ONVIF cameras**, including self-signed certificates. Cameras
  that only expose ONVIF over HTTPS (such as some Dahua models) can now be added.
- **Camera editing** — cameras can be edited in place instead of being deleted and
  re-added.

### Fixed

- Discovery now probes every network interface instead of only the default route,
  so cameras on other interfaces or VLANs can be found.
- Zoom capability detection recognises relative zoom in addition to continuous zoom,
  so varifocal cameras get real optical zoom. When a camera has no optical zoom, the
  on-screen controls are now labelled as digital zoom rather than appearing optical.
- Failures while adding a camera and while scanning are shown in the UI instead of
  being silently discarded.
- A non-ONVIF device replying to a discovery probe no longer crashes the app.

## [0.1.0] - 2026-07-04

First public release.

### Added

- ONVIF camera discovery and manually configured RTSP cameras.
- Live RTSP playback via HLS, with a camera grid and focused single-camera view.
- Snapshot capture.
- PTZ and zoom controls.
- Persistent camera storage.
- Packaged builds for macOS, Windows, and Linux.

[1.1.0]: https://github.com/pinheiroalexandre2/camfoundry/compare/v0.1.0...v1.1.0
[0.1.0]: https://github.com/pinheiroalexandre2/camfoundry/releases/tag/v0.1.0
