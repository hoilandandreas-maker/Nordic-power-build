# Nordic Power Build

A mobile-first workout tracker. Plan a weekly program, log your sets, and
follow a progression model from week to week.

## Features

- **Program** — weekly view of your training days and exercises.
- **Setup** — build your own program: days per week, exercises, sets/reps,
  drag to reorder.
- **Logg** — log weight, reps and completed sets per session.
- **Progresjon** — a selectable progression model plus per-exercise charts
  (estimated 1RM, top set, volume) built from your logged data.
- **Profiles** — multiple people can use the app on one device; each profile
  keeps its own program, log and progression.
- **AI Coach** — an optional Claude-powered personal trainer that can answer
  training questions and propose program/progression changes.

## Progression models

- **Nordic Power Build** — the original 12-week powerlifting block.
- **Lineær progresjon** and **Hypertrofi-blokk** — alternative presets.
- **Egendefinert** — edit your own percentages, sets/reps, phases and number
  of weeks directly in the Progresjon tab.

## Running locally

The app itself is a single static file — just open `index.html` in a browser.
All data is stored in the browser's localStorage.

## AI Coach setup (optional)

The AI Coach needs a small serverless backend, so it only works when the app
is deployed (e.g. to Netlify):

1. Deploy this repository to Netlify. `netlify.toml` already points the build
   at the repo root and the function in `netlify/functions/`.
2. In the Netlify site settings, add an environment variable
   `ANTHROPIC_API_KEY` with your Anthropic API key.
3. Open the deployed app and tap the chat button.

When opened as a local file the rest of the app works normally; only the AI
Coach is unavailable.
