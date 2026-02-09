# Happy Crimpers

A free, zero-friction hangboard training timer. No accounts, no ads, no app install. Open the site on your phone and start training.

**Live app: [sethdrew.github.io/happy-crimpers](https://sethdrew.github.io/happy-crimpers/)**

## What It Does

Two pre-built workouts for the Beastmaker 2000:

**Max Hang** — 6 sets of one-arm hangs on the 4-finger jug. 10s per arm, 15s switch, 3min rest.

**Cooldown** — 3 sets of 30s two-handed hangs on any hold. 1min rest.

Features:
- SVG hangboard diagram with active hold highlighted
- Large countdown timer readable from 5+ feet away
- Audio beeps for go, stop, countdown, and rest warnings
- Dark theme for gym visibility
- Screen stays awake during workouts (Wake Lock API)
- 5-second "get ready" countdown before first hang

## Tech

Static HTML/CSS/JS. No framework, no build step, no backend. Uses Web Audio API for beeps and inline SVG for the hangboard diagram.

```
index.html   — structure and inline SVG
style.css    — dark theme, mobile-first layout
app.js       — timer state machine, audio, workout definitions
```

## Run Locally

Open `index.html` in a browser. That's it.

Or serve it:

```bash
python3 -m http.server 8000
```

## Modify Workouts

Workout definitions live at the top of `app.js` in the `WORKOUTS` object. Each workout has a name, target hold, number of sets, and an array of phases with labels, types, and durations in seconds.

## Contributing

Issues and PRs welcome. Keep it simple — the goal is a tool that does one thing well with zero friction.

## License

MIT
