# Pulsenet Radio — TODO

---

## Before first build

- [ ] Add `.gitignore` (exclude `bin/`, `obj/`, `.vs/`, `*.user`)
- [ ] Update `UpdateChecker.cs:14` GitHub URL once the pulsenet-radio repo is live
  - Current placeholder: `https://api.github.com/repos/Pulsenet-Radio/pulsenet-radio/releases/latest`
- [ ] Replace `Assets/icon.ico` with Pulsenet branding
- [ ] Replace `Assets/logo.png` with Pulsenet branding (used on splash screen)

## Branding / UI

- [ ] Design Pulsenet logo (icon + wordmark)
- [ ] Replace placeholder assets
- [ ] Review `style.css` colour palette — currently dark blue/cyan, adjust to match final brand

## Player features

- [ ] Keyboard shortcuts within the player page (space = play/pause, arrow keys = seek)
- [ ] Volume control (mute/unmute + slider)
- [ ] Display current playlist name alongside track title
- [ ] Shuffle toggle
- [ ] Loop toggle (single track / playlist)
- [ ] "Now Playing" badge visible even when overlay is collapsed (tray tooltip or mini HUD)

## Settings

- [ ] Validate YouTube channel ID format in SettingsWindow before saving (must match `UC[A-Za-z0-9_-]{22}`)
- [ ] Show channel name preview after entering ID (resolve via YouTube oEmbed API, no key required)
- [ ] Allow saving multiple named playlists for quick switching (instead of paste-every-time)

## Distribution

- [ ] Create GitHub repo `Pulsenet-Radio/pulsenet-radio`
- [ ] Set up GitHub Actions CI (build + publish on tag)
- [ ] Create WiX installer (based on SC-HUD installer — strip SC-HUD references)
- [ ] Stable asset naming for auto-update: `pulsenet-portable.exe`, `pulsenet-setup.msi`

## Known issues / notes

- `SelfUpdateService.ApplyMsiAsync` references `pulsenet_update` temp dir — matches new naming
- WebView2 user data is shared across all virtual-host pages (good — auth persists)
- If the Renderer folder is missing at runtime, the overlay will show a navigation error page with a helpful message
- UpdateChecker silently returns "no update" on any HTTP error — safe for the placeholder URL
- The overlay window is fullscreen but fully transparent outside the WebView2 widget — click-through is handled by WPF's `AllowsTransparency` + `Background="Transparent"` combination, not `WS_EX_TRANSPARENT` (which would also pass through the player itself)
