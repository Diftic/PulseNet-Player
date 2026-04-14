# Pulsenet Radio — Dev Log

> Entertainment Division of The Exelus Corporation — "The 'Verse always has a soundtrack."

---

## 2026-03-30 — v0.1.0 — Initial project setup

**Cloned from SC-HUD** and transitioned into a standalone YouTube overlay player.

### What this is
A .NET 9 WPF overlay app (Windows, always-on-top, transparent) with an embedded WebView2 pane. Instead of loading scbridge.app, it serves a locally bundled HTML/CSS/JS YouTube IFrame player from a virtual hostname (`pulsenet.local` → `Renderer/` folder next to exe).

### Architecture decisions

**Virtual host instead of `file://`**
YouTube IFrame API requires the host page to be served over HTTPS. WebView2's `SetVirtualHostNameToFolderMapping` maps `https://pulsenet.local/` to the local `Renderer/` folder, satisfying this requirement without a real server.

**Channel ID via URL query param**
The C# side navigates to `https://pulsenet.local/index.html?channelId=UCxxxxxx`. The JS reads `URLSearchParams` on load. When the user changes the channel ID in Settings, the app re-navigates with the new param. This keeps the C#/JS boundary clean — no custom messaging protocol needed for the core flow.

**Uploads playlist auto-derivation**
Every YouTube channel has an auto-generated uploads playlist with ID `UU` + `channelId[2:]` (swap the `UC` prefix). The player loads this by default so no manual playlist config is needed to get started.

**OAuth/sign-in via existing popup mechanism**
YouTube IFrame handles its own sign-in. Any `window.open()` from within the iframe goes through the existing `OnNewWindowRequested` handler, which opens a shared-environment WebView2 popup. Auth cookies end up in the same user data folder (`%APPDATA%\pulsenet-radio\WebView2Cache`) and persist across restarts.

**`IsAllowedOrigin` is `pulsenet.local` only**
Main-frame navigation is locked to the virtual host. Any other origin (YouTube, Google OAuth redirect) is intercepted in `OnNavigationStarting` and opened as a popup. YouTube iframe content is in a child frame, so it doesn't trigger this filter.

### What was stripped from SC-HUD

| Removed | Reason |
|---------|--------|
| `ScAnchorService.cs` | Watched for `StarCitizen.exe` focus/minimize — no game to anchor to |
| `OverlayUrl` setting | Replaced by `YoutubeChannelId` |
| Environment toggle (Ctrl+Shift+D) | Was a prod/staging scbridge.app switcher |
| SC-specific error messages | Irrelevant |
| `SelfUpdateService` (stub) | Kept but `schud.exe` refs updated to `pulsenet.exe` |

### What was kept

All overlay infrastructure is 100% reused: WebView2 transparency, mouse hook for scroll forwarding, focus stealing, F3 hotkey, ESC close, settings window (redesigned), splash screen, system tray, auto-start, self-update flow.

### Settings model changes

`PulsenetSettings` (was `SchudSettings`):
- Removed: `OverlayUrl`
- Added: `YoutubeChannelId` (default: empty string)
- Kept: `ToggleHotkey`, `WebViewWidthPct`, `WebViewHeightPct`, `WebViewZoomPct`, `AutoStartWithWindows`, `InstallationId`

### File inventory

```
pulsenet-radio/
├── src/
│   ├── App.xaml / App.xaml.cs       — lifecycle, DI, window wiring
│   ├── Constants.cs                  — app name, GUID, folder names, virtual host
│   ├── Program.cs                    — entry point, single-instance mutex
│   ├── app.manifest                  — PerMonitorV2 DPI awareness
│   ├── pulsenet.csproj
│   ├── Assets/
│   │   ├── icon.ico                  — placeholder (SC-HUD icon)
│   │   └── logo.png                  — placeholder (SC-HUD logo)
│   ├── Models/
│   │   ├── PulsenetSettings.cs
│   │   └── Keyboard/                 — hotkey binding model (unchanged from SC-HUD)
│   ├── PInvoke/                      — Win32 wrappers (unchanged)
│   ├── Renderer/                     — NEW: local HTML/CSS/JS YouTube player
│   │   ├── index.html
│   │   ├── style.css
│   │   └── player.js
│   ├── Services/
│   │   ├── AutoStartManager.cs       — Windows startup registry
│   │   ├── GlobalHotkeyListener.cs   — WH_KEYBOARD_LL hook, F3 + ESC
│   │   ├── SelfUpdateService.cs      — exe/MSI swap updater
│   │   └── UpdateChecker.cs          — GitHub releases API (URL is placeholder)
│   ├── Settings/
│   │   └── SettingsManager.cs        — JSON persistence to %APPDATA%\pulsenet-radio\
│   └── UI/
│       ├── OverlayWindow.xaml/cs     — WebView2 overlay, virtual host init
│       ├── SettingsWindow.xaml/cs    — channel ID field replaces URL/env fields
│       ├── SplashWindow.xaml/cs      — startup splash
│       ├── TrayIcon.cs               — system tray
│       └── WpfKeyMapper.cs           — WPF Key → KeyboardKey
├── Directory.Build.props
├── Directory.Packages.props
└── pulsenet.slnx
```

---

## 2026-03-30 — Simplify overlay: remove opacity, transparent background

The overlay was inherited from SC-HUD which had a fullscreen semi-transparent backdrop to darken the game world behind it. That's not appropriate for a radio player — the overlay should sit on top of whatever you're doing without covering it.

**Changes:**

- Removed `OverlayOpacity` and `BackgroundOpacity` from `PulsenetSettings` — the overlay runs at full opacity, always
- Removed `ApplyOpacity` and `ApplyBackgroundOpacity` from `OverlayWindow` — including the CSS `opacity` injection hack (was needed because WebView2's DirectComposition surface bypasses `Window.Opacity`; no longer relevant)
- `BuildOverlayStyleScript` simplified to zoom-only; still injects `background:transparent` on `html,body` so the renderer's own background doesn't block anything
- `OverlayWindow.xaml` background changed from `#1a1a1a @ 5%` to `Transparent` — with `AllowsTransparency="True"`, WPF passes clicks through fully transparent pixels, so everything outside the WebView2 widget is now click-through
- Removed Opacity and Background Opacity sliders from `SettingsWindow.xaml`; window height shrunk from 580 → 460 accordingly
- `SettingsWindow` constructor signature simplified (dropped `opacityPreview` and `bgOpacityPreview` callbacks)

**Result:** The fullscreen WPF window still covers the primary display, but only the WebView2 widget itself is visible and interactive. All surrounding area is invisible and click-through.

---

---

## 2026-04-14 — Modules 0-2 — Sci-fi frame overlay rebuild

**Architecture decision: stay WPF, not Python rewrite.**
The RadioPlan.md proposal to rewrite in PyQt6 was discarded — no technical justification, WebView2 is more reliable than QWebEngineView on Windows for YouTube, and the existing WPF infrastructure was already proven.

### Frame asset
- Source image: `src/Assets/radio_backround.png` — 2515×1292, transparent outside frame
- Video area cut to fully transparent by user
- Displayed at 50% → **1258×646** window
- Video rect within display: `left=220 top=100 width=812 height=433`
- Left button column: `x=0 y=100 w=220 h=433`
- Right button column: `x=1032 y=100 w=226 h=433`

### Renderer rebuild (everything visual lives in HTML/CSS/JS)
WPF airspace problem (WebView2 HWND always renders above WPF visuals) means the frame and buttons cannot be WPF elements. Solution: put everything in the renderer.

Layer stack (z-index):
1. YouTube iframe — `video-wrap` at video rect
2. `frame_base.png` — structural frame, `pointer-events:none`
3. `frame_glow.png` — glow overlay, CSS pulse animation, hidden until asset exists
4. Station buttons — `pointer-events:auto`, inside frame panel areas

### Station buttons
- 18 buttons: 9 left column + 9 right column
- Icon-based; hover shows station name (tooltip)
- Defined in `Renderer/stations.js` — all pointing to `@Mr_Xul` test channel
- Clicking a button calls `player.loadPlaylist()` via YouTube IFrame API
- Active button gets cyan glow border

### Window changes
- Fixed size: `Constants.FrameDisplayWidth × FrameDisplayHeight` (1258×646)
- No longer fullscreen — centered on primary screen on show
- Drag-to-move: JS detects mousedown on frame border areas, posts `{type:'drag', dx, dy}` to C#, which moves the window via `Left += dx; Top += dy`
- Removed: `ApplySize`, `WebViewWidthPct`, `WebViewHeightPct`
- Kept: `ApplyZoom`, zoom slider in settings

### Channel ID
- Test channel: `@Mr_Xul` → `UCDemStdcwUHbqhD2ePbKH6A`
- Default uploads playlist: `UUDemStdcwUHbqhD2ePbKH6A`
- Stored in `Constants.DefaultChannelId`

### Remaining before first run
- `frame_glow.png` — glow-only layer for animation (separate from frame_base)
- Test build against real YouTube playback

---

## In-Universe Lore

**Pulse Broadcasting Network (PulseNet)**
Entertainment Division of The Exelus Corporation

- Founded: 2905 (51+ years of operation as of story time)
- Scope: One of the UEE's largest entertainment broadcast networks
- Tagline: *"The 'Verse always has a soundtrack."*
