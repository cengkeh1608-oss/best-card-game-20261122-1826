// input.js — mouse and keyboard controls for LANTERN DUEL.
// One job: translate clicks and keys into game actions, and fire the
// matching feedback (card flight, floating damage, shake, sound).

import { LAYOUT, PALETTE } from './config.js';
import { backToTitle, chooseReward, endPlayerTurn, playCard, restartRun, startRun } from './state.js';
import { floatText, flyCard, handLayout, rewardLayout, shake } from './render.js';

function canvasPos(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function inRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

function tryPlayCard(game, view, audio, slot) {
  const before = game.enemy ? game.enemy.hp : 0;
  const result = playCard(game, slot.card.uid);
  if (!result.ok) {
    audio.deny();
    return;
  }
  flyCard(view, slot.card, slot.x + slot.w / 2, slot.y + slot.h / 2);
  audio.playCard();
  if (result.dealt > 0) {
    floatText(view, 640, 150, `-${result.dealt}`, PALETTE.coral);
    if (result.dealt >= 10) shake(view, 220, 5);
  }
  if (result.resonated) {
    floatText(view, 640, 120, 'RESONANCE!', '#D9A441');
    audio.resonance();
  }
  if (before > 0 && game.enemy && game.enemy.hp <= 0) audio.winRound();
}

function tryEndTurn(game, view, audio) {
  const resolved = endPlayerTurn(game, view, audio);
  if (!resolved) return;
  if (resolved.kind === 'strike' && resolved.hurt > 0) {
    floatText(view, 640, 470, `-${resolved.hurt}`, PALETTE.red);
    shake(view, 260, 6);
    audio.hurt();
  } else if (resolved.kind === 'guard') {
    floatText(view, 640, 150, `+${resolved.value} block`, '#2E7D7B');
    audio.guard();
  } else if (resolved.kind === 'charge') {
    floatText(view, 640, 150, 'CHARGED!', '#D9A441');
    audio.charge();
  }
  if (game.screen === 'defeat') audio.lose();
}

export function attachInput(canvas, game, view, audio) {
  canvas.addEventListener('mousemove', (event) => {
    const p = canvasPos(canvas, event);
    view.hoverUid = null;
    view.hoverReward = -1;
    if (game.screen === 'battle') {
      const layout = handLayout(game);
      for (let i = layout.length - 1; i >= 0; i--) {
        if (inRect(p, layout[i])) {
          view.hoverUid = layout[i].uid;
          break;
        }
      }
    } else if (game.screen === 'reward') {
      const layout = rewardLayout();
      for (const slot of layout) {
        if (inRect(p, slot)) view.hoverReward = slot.index;
      }
    }
  });

  canvas.addEventListener('click', (event) => {
    const p = canvasPos(canvas, event);
    audio.unlock();
    if (game.screen === 'title') {
      startRun(game);
      audio.start();
      return;
    }
    if (game.screen === 'battle') {
      const layout = handLayout(game);
      for (let i = layout.length - 1; i >= 0; i--) {
        if (inRect(p, layout[i])) {
          tryPlayCard(game, view, audio, layout[i]);
          return;
        }
      }
      if (inRect(p, LAYOUT.endTurn)) {
        tryEndTurn(game, view, audio);
      }
      return;
    }
    if (game.screen === 'reward') {
      const layout = rewardLayout();
      for (const slot of layout) {
        if (inRect(p, slot)) {
          if (chooseReward(game, slot.index)) audio.reward();
          return;
        }
      }
      return;
    }
    if (game.screen === 'victory' || game.screen === 'defeat') {
      if (p.x >= 520 && p.x <= 760 && p.y >= 452 && p.y <= 502) {
        restartRun(game);
        audio.start();
      }
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key;
    if (game.screen === 'title') {
      if (key === 'Enter' || key === ' ') {
        event.preventDefault();
        startRun(game);
        audio.unlock();
        audio.start();
      }
      return;
    }
    if (game.screen === 'battle') {
      if (key === ' ' || key === 'Enter') {
        event.preventDefault();
        tryEndTurn(game, view, audio);
        return;
      }
      if (key === 'Escape') {
        backToTitle(game);
        return;
      }
      const idx = key >= '1' && key <= '9' ? Number(key) - 1 : key === '0' ? 9 : -1;
      if (idx >= 0) {
        const layout = handLayout(game);
        if (layout[idx]) tryPlayCard(game, view, audio, layout[idx]);
      }
      return;
    }
    if (game.screen === 'reward') {
      if (key >= '1' && key <= '3') {
        if (chooseReward(game, Number(key) - 1)) audio.reward();
      }
      return;
    }
    if (game.screen === 'victory' || game.screen === 'defeat') {
      if (key === 'r' || key === 'R' || key === 'Enter') {
        restartRun(game);
        audio.start();
      } else if (key === 'Escape') {
        backToTitle(game);
      }
    }
  });
}
