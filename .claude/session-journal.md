# Session Journal

A living journal that persists across compactions. Captures decisions, progress, and context.

## Current State
- **Focus:** Modules 0-2 complete and building. Ready for first test run.
- **Blocked:** frame_glow.png not yet created (glow animation layer). Not blocking first run.

## Log

### 2026-04-14 14:00 — Completed: Modules 0-2 sci-fi frame overlay rebuild
- Rebuilt renderer from scratch: frame_base.png overlay, YouTube iframe at video rect, 18 station buttons
- Window changed from fullscreen to fixed 1258×646 (frame canvas at 50% scale)
- JS drag-to-move implemented: mousedown on frame border → postMessage → C# moves window
- All station buttons wired to @Mr_Xul test channel (UCDemStdcwUHbqhD2ePbKH6A) with placeholder icons
- Build: green — 0 errors, 0 warnings

### 2026-04-14 13:00 — Decision: stay WPF, discard Python rewrite
- RadioPlan.md proposed PyQt6 rewrite — no technical justification found
- WPF prototype already has working WebView2, hotkeys, transparency, tray, settings
- All visual layers live in HTML/CSS/JS renderer to avoid WPF airspace problem

### 2026-04-14 12:00 — Plan: frame layout and station spec locked
- Frame source: 2515×1292, displayed at 50% = 1258×646
- Video rect: left=220 top=100 width=812 height=433
- 18 station buttons: 9 left column, 9 right column, icon-based with hover tooltip
- YouTube channel confirmed: @Mr_Xul = UCDemStdcwUHbqhD2ePbKH6A
- frame_glow.png needed from user for glow animation (Phase 2)
