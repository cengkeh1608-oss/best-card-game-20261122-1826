// main.js — boot and game loop for LANTERN DUEL.
// One job: wire the canvas, state, renderer and input together, run
// the animation frame loop, and expose a small debug handle the
// playtest uses (window.__lanternDuel). The game itself never reads
// the network and never reads the URL except for ?shot= screenshots.

import { createAudio, makeSounds } from './audio.js';
import { attachInput } from './input.js';
import { createView, draw } from './render.js';
import { createGameForShot } from './shots.js';
import { backToTitle, endPlayerTurn, playCard, restartRun, startRun } from './state.js';
import { VIEW_H, VIEW_W } from './config.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const game = createGameForShot(window.location.search);
const view = createView();
const audio = makeSounds(createAudio());

attachInput(canvas, game, view, audio);

function frame(now) {
  draw(ctx, game, view, now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Debug handle for automated playtests: read state, play a card by
// hand index, end the turn, force screens. Not part of the game UI.
window.__lanternDuel = {
  game,
  view,
  playHandIndex(i) {
    const card = game.hand[i];
    if (!card) return { ok: false, reason: 'no card at index' };
    return playCard(game, card.uid);
  },
  endTurn() {
    return endPlayerTurn(game, view, audio);
  },
  start() {
    startRun(game);
  },
  restart() {
    restartRun(game);
  },
  title() {
    backToTitle(game);
  },
  size() {
    return { w: VIEW_W, h: VIEW_H };
  },
};
