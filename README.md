# LANTERN DUEL — a lantern-festival card battler

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/cengkeh1608-oss/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/cengkeh1608-oss/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

**LANTERN DUEL** is an original deck-builder card battler for the
[best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826)
on make.fun. You are the Lantern Keeper of a night festival. Play cards
from your hand to defeat three lantern spirits — Cinder Fox, Tide
Merchant, and the Lantern Warden — and build your deck between rounds.

## How to play

- **Your turn:** you draw 5 cards and get 3 energy. Click a card (or
  press 1–9) to play it. Attack with Ember, draw with Tide, guard with
  Leaf, or bend the odds with Star.
- **Resonance:** play two cards of the same suit in one turn and the
  second one is stronger (+3 damage, +1 draw, +3 block, or +1 energy).
- **The enemy shows its next move** as a face-up card — block the big
  hits, race the charges. Every 3rd turn the enemy charges, and its
  next strike hits double.
- **Win a round** to choose 1 of 3 new cards for your deck. Win all
  three rounds to light the festival. Lose all your HP and your lantern
  goes out.

## Controls

- Mouse: click a card to play it, click END TURN, click a reward card.
- Keyboard: `1–9` play a card, `Space`/`Enter` end turn, `R` restart,
  `Esc` back to the title.

## Play it

Open `game/index.html` in a desktop browser (or serve `game/` with any
static server). No network, no build step — plain static files.

## Files

- `game/` — the game (canvas, no libraries): `index.html` plus
  `src/` modules, one job each (cards, enemies, state, render, input,
  audio, shots).
- `screenshots/` — 4 real renders of the game: live battle (cover),
  title, victory, defeat.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/`
  to `/output` and writes `dossier.json`.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
