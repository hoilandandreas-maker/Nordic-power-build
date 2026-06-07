# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**Nordic Power Build** — a mobile-first workout tracker. Plan a weekly program, log sets,
and follow a week-to-week progression model. It is a **single static file** with no backend
and no build step; all state lives in the browser's `localStorage`.

## Layout

- `index.html` — the entire app (markup, styles, and JS inline). This is the only source file.
- `README.md` — feature and progression-model overview.

There is no package manager, bundler, or server. Edit `index.html` directly.

## Run

```bash
# Just open it:
start index.html        # Windows
# or serve the folder with any static host, e.g.:
python -m http.server
```

## App areas

- **Program** — weekly view of training days and exercises.
- **Setup** — build a program: days/week, exercises, sets/reps, drag to reorder.
- **Logg** — log dated workouts with optional cycle-week tagging.
- **Progresjon** — selectable progression model + per-exercise charts (est. 1RM, top set,
  volume) from logged data.
- **Profiles** — multiple people on one device; each profile keeps its own program/log/progression.

Progression models: *Nordic Power Build* (12-week powerlifting block), *Lineær progresjon*,
*Hypertrofi-blokk*, and *Egendefinert* (user-editable percentages, sets/reps, phases, weeks).

## Conventions

- **Single-file architecture is intentional** — keep new features inside `index.html` unless
  there's a strong reason to introduce a build step (which would change how the app is run/hosted).
- Persisted data is keyed in `localStorage`; when changing the data shape, preserve or migrate
  existing keys so users don't lose logged workouts.
- UI labels are Norwegian; match the existing wording.
