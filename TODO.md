# Pulsenet Radio — TODO

---

## Done ✓

- [x] Replace `Assets/icon.ico` with Pulsenet branding (multi-res .ico from PulseNetIcon 1024x1024.png)
- [x] Replace splash screen logo with Pulsenet branding (`main_logo.png`)
- [x] Replace idle video logo with Pulsenet branding (`main_logo.png` 812×433)
- [x] Wire real Pulsenet channel ID (`UCIMaIJsfJEMi5yJIe5nAb0g`)
- [x] Rebuild drag system — JS-initiated via `startDrag`, whole frame draggable except buttons/video/settings
- [x] Zoom resizes window (not CSS zoom) — no blink, correct hit areas
- [x] Zoom slider replaced with -10%/input/+10% buttons
- [x] Settings panel doubled in size
- [x] Window position persists between open/close
- [x] Scroll wheel only captured when cursor is over overlay
- [x] Frame width trimmed to 1202px (28px each side) to better fit frame_base.png
- [x] Video iframe scaled (transform: scale(1.055)) to fill 16:9 pillarbox bars
- [x] Station `videoId` support alongside `playlistId` for single-video stations
- [x] Top-left station wired to test video for playback verification
- [x] PulseNet home button (top-left) — plays live stream, uses pulsenet_icon.png
- [x] Info button (bottom-right) — text label, shows info.png on hover, wired to `{type:'about'}`
- [x] Station buttons resized to 32×32px DOM
- [x] Button columns centred so mid-gap between items 5 and 6 aligns to video vertical centre
- [x] Station hover preview masked by frame (z-index 1, behind frame overlay)
- [x] Offline station images — `live` flag in stations.js, auto `Offline_` prefix on hover when offline
- [x] Mouse hook only active while overlay is visible — no global scroll impact when hidden

## Stations

- [ ] Wire real playlist IDs for all 18 stations — set `live: true` and replace placeholder `playlistId` per station as they go live
- [ ] Wire Info button click (`{type:'about'}`) to a C# handler (show about dialog or info overlay)
- [ ] Confirm station icons are final and correctly matched to stations
- [ ] Add `frame_glow.png` asset for glow animation layer

## Player features

- [ ] Volume control (mute/unmute + slider)
- [ ] "Now Playing" tray tooltip — poll `player.getVideoData().title` and update `NotifyIcon.Text`
- [ ] Shuffle toggle
- [ ] Loop toggle (single track / playlist)
- [ ] Keyboard shortcuts within player (space = play/pause, arrow keys = seek)

## Settings

- [ ] Validate YouTube channel ID format before saving (must match `UC[A-Za-z0-9_-]{22}`)
- [ ] Show channel name preview after entering ID (YouTube oEmbed API, no key required)
- [ ] Update `UpdateChecker.cs` GitHub URL once the pulsenet-radio repo is live

## Distribution

- [x] **Establish GitHub repo** — https://github.com/Diftic/pulsenet-radio
- [ ] **Auto-update feature** — port the update mechanism from the Signature Scanner project
- [ ] Set up GitHub Actions CI (build + publish on tag)
- [ ] Create WiX installer (based on SC-HUD installer — strip SC-HUD references)
- [ ] Stable asset naming for auto-update: `pulsenet-portable.exe`, `pulsenet-setup.msi`

## Known issues / notes

- `frame_glow.png` referenced in HTML but file not yet created — `onerror` hides it gracefully
- YouTube share/logo buttons cannot be removed — cross-origin iframe restriction + ToS
- YouTube IFrame API does not fire a title-change event — `getVideoData().title` is polled every 2s while playing
- WebView2 user data shared across all virtual-host pages — auth persists across restarts
- If Renderer folder missing at runtime, overlay shows a navigation error page with helpful message
- `SelfUpdateService.ApplyMsiAsync` references `pulsenet_update` temp dir — matches naming
