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
- Kept: `ToggleHotkey`, `OverlayOpacity`, `BackgroundOpacity`, `WebViewWidthPct`, `WebViewHeightPct`, `WebViewZoomPct`, `AutoStartWithWindows`, `InstallationId`

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

## In-Universe Lore

**Pulse Broadcasting Network (PulseNet)**
Entertainment Division of The Exelus Corporation

- Founded: 2905 (51+ years of operation as of story time)
- Scope: One of the UEE's largest entertainment broadcast networks
- Tagline: *"The 'Verse always has a soundtrack."*
