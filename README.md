# TamaPip 🥚

A Tamagotchi-inspired virtual pet game that runs entirely in the browser. Hatch, raise, and battle pixel-art pets through a retro CRT-styled interface — no backend, no persistence, just pure in-memory fun.

## Features

- **Full pet lifecycle** — Egg → Baby → Child → Teen → Adult, driven by age thresholds
- **Care system** — Feed, Play, Clean, Sleep, and Medicine actions with per-action cooldowns
- **Stat decay** — Hunger, Happiness, Cleanliness, and Energy decay over time; slower while sleeping
- **Sickness & death** — Neglect causes HP decay; reach 0 and it's Game Over
- **Turn-based PvE battles** — Attack, Defend, Special, and Heal against CPU opponents scaled to your pet's stage
- **Care → combat link** — Your pet's care stats directly influence battle performance
- **Event log** — Timestamped log of the last 30 game events
- **Retro CRT UI** — Press Start 2P font, scanlines, neon glow, segmented stat bars

## Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## How to Play

1. Your pet hatches as an **Egg** — care for it to help it evolve
2. Use the action buttons to keep its stats up:
   - 🍖 **Feed** — restores Hunger (+25)
   - 🎮 **Play** — boosts Happiness (+30), costs Energy (-15)
   - 🧹 **Clean** — restores Cleanliness (+35), clears waste
   - 💤 **Sleep** — regenerates Energy over time (auto-wakes at 95)
   - 💊 **Medicine** — restores Health (+30), usable even when sick
3. Stats decay every 2 seconds — don't neglect your pet!
4. If average care stats drop below 25, your pet gets **sick** and loses HP each tick
5. Once your pet reaches **Child** stage or beyond, you can **Battle** CPU opponents
6. Battles use your care stats as combat stats — a well-fed, happy, clean pet fights better

## Battle System

| Action  | Effect |
|---------|--------|
| ⚔️ Attack  | Deals `max(1, attack - cpu.defense/2)` damage |
| 🛡️ Defend  | Reduces next incoming hit by 50% |
| ✨ Special | Deals `max(1, special × 1.5 - cpu.defense/2)` damage |
| 💊 Heal    | Restores 20 HP (capped at max HP) |

CPU opponents scale in difficulty with your pet's stage.

## Tech Stack

- **React 18** with hooks (`useState`, `useEffect`, `useRef`, `useCallback`)
- **Vite** for dev server and bundling
- **Tailwind CSS** for utility classes
- **Press Start 2P** font via Google Fonts
- **Vitest** + **fast-check** for unit and property-based tests

## Running Tests

```bash
npm run test:run
```

29 tests across pure helper functions and battle logic, including property-based tests for stat clamping, decay invariants, evolution monotonicity, and battle mechanics.

## Project Structure

```
src/
├── Tamagotchi.jsx   # Single-file component — all game logic + UI
├── helpers.test.js  # Unit tests for pure helper functions
├── battle.test.js   # Unit + property-based tests for battle logic
├── test-setup.js    # Vitest setup (jest-dom matchers)
├── main.jsx         # App entry point
└── index.css        # Tailwind + Google Fonts import
```
