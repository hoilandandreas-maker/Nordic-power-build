# Nordic Power Build

A mobile-first workout tracker. Plan a weekly program, log your sets, and
follow a progression model from week to week.

## Features

- **Logg** — log dated workouts with optional cycle-week tagging; add or
  remove individual sets per exercise.
- **Setup** — build your own program: days per week, exercises, sets/reps,
  drag to reorder.
- **Progresjon** — per-exercise progress charts (estimated 1RM, top set,
  volume) built from your logged data.
- **Profiles** — multiple people can use the app on one device; each profile
  keeps its own program, log and progression.

## Progression models

Selected under **Innstillinger → Progresjonsmodell**; they set the suggested
weights and reps for your main lifts when logging.

- **Nordic Power Build** — the original 12-week powerlifting block.
- **Lineær progresjon** and **Hypertrofi-blokk** — alternative presets.
- **Egendefinert** — a custom slot based on your own week settings.

## Running

The app is a single static file — just open `index.html` in a browser, or
serve the repo with any static host. All data is stored in the browser's
localStorage.
