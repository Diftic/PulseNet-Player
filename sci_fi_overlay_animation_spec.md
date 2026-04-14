# Sci-Fi Overlay Frame — Animation Specification

## Purpose
Define a clean, low-distraction animation system for a compact 16:9 video overlay (800×450) inside a 960×540 frame.

---

## Base Geometry

- Canvas: **960 × 540**
- Video window: **800 × 450 (16:9)**
- Margins:
  - Horizontal: **80px (left/right)**
  - Vertical: **45px (top/bottom)**

---

## Layer Architecture

The system must be modular:

```
FRAME BASE (static)
+ GLOW / LIGHT LAYER (animated)
+ VIDEO CONTENT (YouTube)
```

### Layers
1. `frame_base.png`
   - No glow
   - All structural elements

2. `frame_glow.png`
   - ONLY light elements
   - Transparent background

3. Animation applied only to `frame_glow`

---

## Light Segmentation

Divide lights into independent zones:

- Top strip
  - Left / Center / Right
- Bottom strip
  - Left / Center / Right
- Side strips
  - Left vertical
  - Right vertical
- Corners (optional separate elements)

---

## Animation Types

Use **maximum 1–2 animation types simultaneously**.

### 1. Pulse (Primary)

- Brightness range: **70% → 100% → 70%**
- Duration: **3–5 seconds**
- Curve: **sine (ease-in-out)**

Effect:
- Subtle “alive” system
- Non-distracting

---

### 2. Traveling Highlight (Optional)

- Soft glow moving along edges
- Loop duration: **6–10 seconds**

Direction:
- Top: left → right
- Bottom: right → left
- Sides: top → bottom

Effect:
- Energy flow / system scanning

---

### 3. Micro Flicker (Optional)

- Interval: **every 5–15 seconds**
- Intensity variation: **±5–10%**

Effect:
- Adds realism
- Should not be consciously noticeable

---

## Motion Constraints (Critical)

Do NOT:

- Use fast blinking
- Use hard on/off transitions
- Animate multiple competing effects
- Exceed brightness that competes with video

Rule:
> If the user notices the animation during gameplay → it is too strong.

---

## Animation Parameters (Reference Values)

### Pulse
- Base opacity: **0.6**
- Peak opacity: **1.0**
- Duration: **4 seconds**
- Curve: **sine**

### Traveling Highlight
- Width: **10–20px (soft gradient)**
- Loop duration: **~8 seconds**
- Peak intensity: **1.2× base glow (max)**

---

## Implementation Options

### Option 1 — Looped Video (Recommended Start)

- Format: WebM (preferred) or MP4
- Duration: 5–10 seconds
- Seamless loop
- Overlay on top of frame

Pros:
- Simple
- Low CPU

---

### Option 2 — GIF / APNG

Pros:
- Easy to produce

Cons:
- Larger file size
- Lower quality

---

### Option 3 — Real-Time Animation (Best Long-Term)

Animate glow in code.

Example (Python concept):

```python
import math
import time

# time in seconds
t = time.time()

# sine-based pulse
brightness = 0.6 + 0.4 * math.sin(t)
```

Benefits:
- Smooth animation
- Fully controllable
- Lightweight

---

## Visual Priority Rules

- Video content = highest contrast and brightness
- Frame = secondary
- Animation = tertiary (barely noticeable)

---

## Minimum Viable Version

Start with:

- Static frame
- Subtle pulsing glow only
- No moving highlights

Then iterate.

---

## Validation Checklist

Before deployment:

- [ ] Video window is exact 800×450
- [ ] No frame elements overlap video
- [ ] Animation is not distracting
- [ ] Glow intensity is restrained
- [ ] Works at actual display size (not zoomed)

---

## Design Principle

> The frame supports the content. It must never compete with it.

