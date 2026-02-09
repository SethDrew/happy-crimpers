# Happy Crimpers - Hangboard Training Tool

## Overview
A zero-friction, mobile-first web app for hangboard training. No accounts, no login, no ads. Open the site and start your workout immediately.

## Platform & Constraints
- **Web-based** (HTML/CSS/JS — single page, no framework required)
- **Mobile-only optimization** (portrait orientation, phone propped up at hangboard)
- **No backend** for V1 — fully static, deployed to GitHub Pages
- **No accounts, no logging, no customization** in V1

---

## Screens / Flow

### 1. Home Screen
- App name: **Happy Crimpers**
- Two buttons:
  - **Max Hang** — starts Workout 1
  - **Cooldown** — starts Workout 2
- Small disclaimer at bottom: *"Ensure your warm-up is complete before starting any workout."*

### 2. Workout Screen
- **Hangboard diagram** at top (see Visuals section)
- **Current phase label** — e.g. "ARM 1 — HANG", "REST", "SWITCH ARMS"
- **Large countdown timer** — big enough to read from ~5 feet away
- **Set/rep progress indicator** — e.g. "Set 3 of 6"
- **Audio beeps** for cues (see Audio section)
- **Stop button** — returns to Home Screen (with simple "Are you sure?" confirm)

### 3. Complete Screen
- "Workout Complete" message
- Button to return to Home Screen

---

## Workouts

### Workout 1: Max Hang
- **Hold:** 4-finger jug, bottom center of Beastmaker 2000 (~50mm depth)
- **Type:** One-arm hangs
- **Sets:** 6
- **Structure per set:**
  1. **Arm 1 hang** — 10 seconds
  2. **Switch** — 15 seconds
  3. **Arm 2 hang** — 10 seconds
  4. **Rest** — 3 minutes (180 seconds)
- Last set: no trailing rest (go straight to Complete Screen)
- Arm order is user's choice (hold is symmetrical, no need to specify left/right)
- **Total duration:** ~18.5 minutes
  - 6 sets × (10s + 15s + 10s + 180s) = 6 × 215s = 1290s
  - Minus last rest: 1290 - 180 = 1110s ≈ 18.5 min

### Workout 2: Cooldown
- **Hold:** Any hold (user's choice — diagram highlights nothing specific, or shows all holds)
- **Type:** Two-handed hangs
- **Sets:** 3
- **Structure per set:**
  1. **Hang** — 30 seconds
  2. **Rest** — 60 seconds
- Last set: no trailing rest
- **Total duration:** ~4 minutes
  - 3 × (30s + 60s) = 270s, minus last rest = 210s = 3.5 min

---

## Visuals

### Hangboard Diagram
- **Create a custom SVG** of the Beastmaker 2000 layout (avoids any licensing issues with product photos)
- Simplified top-down view showing all hold positions with correct relative sizes/positions
- Holds labeled or identifiable
- **Active holds highlighted in color** (e.g., bright green or orange glow/fill) during workout
  - Max Hang: highlight the 4-finger jug (bottom center)
  - Cooldown: no specific highlight, or subtle highlight on all holds with "Your choice" label

### Reference: Beastmaker 2000 Hold Layout
The board (580mm × 150mm) has roughly this layout (top to bottom, left to right):

**Top row:** 45° sloper (L), 35° sloper (L), 20° sloper (center), 35° sloper (R), 45° sloper (R)
**Middle row:** 3-finger pocket (L), small 2-finger pocket (L), **22mm middle edge (center)**, small 2-finger pocket (R), 3-finger pocket (R)
**Bottom row:** back 2-pocket (L), sloping mono (L), 4-finger jug (center), 1-pad mono (R), back 2-pocket (R)

*(Exact positions to be refined from reference photos during build)*

---

## Timer & Audio

### Timer Display
- Countdown number should be **very large** (minimum ~120px font)
- High contrast (white on dark background recommended for gym lighting)
- Phase label above timer ("HANG", "REST", "SWITCH ARMS")

### Audio Cues
Simple beep tones only (no voice in V1):
- **3-2-1 countdown beeps** before each hang starts (short beeps at T-3, T-2, T-1)
- **GO beep** — distinct tone when hang begins (lower pitch or double beep)
- **STOP beep** — when hang ends (different tone)
- **Warning beep** — at 10 seconds remaining during rest periods (so user can get ready)
- Use Web Audio API for reliable, low-latency playback (no audio file dependencies)

---

## Tech Stack (Recommended)
- **Single HTML file** or minimal file structure (index.html + style.css + app.js + hangboard.svg)
- **Vanilla JS** — no framework needed for this scope
- **CSS** — mobile-first, dark theme for gym readability
- **Web Audio API** — for beep generation
- **SVG** — for hangboard diagram (inline or separate file)
- **No build step** — deployable as-is

---

## Design Notes
- Dark background (dark gray or black) for visibility in gyms
- Large, bold typography
- Minimal UI — only show what's needed for current phase
- Screen should stay awake during workout (use Wake Lock API where supported)
- No scrolling during workout — everything visible in viewport

---

## Deployment
- **GitHub Pages** from this repository
- No custom domain needed for V1

---

## Future Ideas (NOT in V1)
- User accounts & workout logging
- Custom workout builder
- Multiple hangboard support
- Weight tracking (added weight for max hangs)
- Voice cues
- Progress graphs
- Workout sharing
