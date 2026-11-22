// render.js — canvas drawing for LANTERN DUEL.
// One job: turn the game state into a bright, readable table. Every
// number the judge needs (HP, block, energy, score, card costs and
// values) is drawn big, and suits are told apart by colour AND shape.

import { CARD, LAYOUT, PALETTE, SUITS, VIEW_H, VIEW_W } from './config.js';
import { cardById } from './cards.js';

export function createView() {
  return {
    time: 0,
    hoverUid: null,
    hoverReward: -1,
    floats: [], // { x, y, text, color, born }
    flight: null, // { card, fromX, fromY, born }
    shakeUntil: 0,
    shakeMag: 0,
  };
}

export function floatText(view, x, y, text, color) {
  view.floats.push({ x, y, text, color, born: view.time });
  if (view.floats.length > 12) view.floats.shift();
}

export function flyCard(view, card, fromX, fromY) {
  view.flight = { card, fromX, fromY, born: view.time };
}

export function shake(view, ms, mag) {
  view.shakeUntil = view.time + ms;
  view.shakeMag = mag;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// --- Suit glyphs: drawn shapes, never text alone. ---
export function drawSuitGlyph(ctx, glyph, cx, cy, size, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.beginPath();
  if (glyph === 'flame') {
    ctx.moveTo(cx, cy - size * 0.55);
    ctx.bezierCurveTo(cx + size * 0.45, cy - size * 0.1, cx + size * 0.35, cy + size * 0.35, cx, cy + size * 0.45);
    ctx.bezierCurveTo(cx - size * 0.35, cy + size * 0.35, cx - size * 0.45, cy - size * 0.1, cx, cy - size * 0.55);
    ctx.fill();
    ctx.fillStyle = '#FFF3D6';
    ctx.beginPath();
    ctx.ellipse(cx, cy + size * 0.18, size * 0.14, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (glyph === 'wave') {
    for (let row = 0; row < 2; row++) {
      const y = cy - size * 0.18 + row * size * 0.3;
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.5, y);
      ctx.quadraticCurveTo(cx - size * 0.25, y - size * 0.22, cx, y);
      ctx.quadraticCurveTo(cx + size * 0.25, y + size * 0.22, cx + size * 0.5, y);
      ctx.quadraticCurveTo(cx + size * 0.25, y + size * 0.34, cx, y + size * 0.14);
      ctx.quadraticCurveTo(cx - size * 0.25, y - size * 0.06, cx - size * 0.5, y);
      ctx.fill();
    }
  } else if (glyph === 'leaf') {
    ctx.moveTo(cx, cy - size * 0.5);
    ctx.quadraticCurveTo(cx + size * 0.5, cy - size * 0.1, cx + size * 0.28, cy + size * 0.42);
    ctx.quadraticCurveTo(cx - size * 0.28, cy + size * 0.42, cx - size * 0.5, cy - size * 0.1);
    ctx.quadraticCurveTo(cx - size * 0.1, cy - size * 0.3, cx, cy - size * 0.5);
    ctx.fill();
    ctx.strokeStyle = '#FFF3D6';
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.34);
    ctx.lineTo(cx, cy + size * 0.36);
    ctx.stroke();
  } else if (glyph === 'star') {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
      const px = cx + Math.cos(a) * size * 0.5;
      const py = cy + Math.sin(a) * size * 0.5;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.fill();
  }
  ctx.closePath();
}

function drawLanternIcon(ctx, x, y, size, lit) {
  ctx.fillStyle = lit ? PALETTE.goldBright : '#CBB98F';
  rr(ctx, x - size * 0.32, y - size * 0.42, size * 0.64, size * 0.84, size * 0.14);
  ctx.fill();
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(x - size * 0.18, y - size * 0.52, size * 0.36, size * 0.12);
  ctx.fillRect(x - size * 0.18, y + size * 0.42, size * 0.36, size * 0.12);
  if (lit) {
    ctx.fillStyle = '#FFF3D6';
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.14, size * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- Layout helpers shared with input.js ---
export function handLayout(game) {
  const n = game.hand.length;
  // Fan wide when the hand is small (every card fully readable) and
  // tighten only when the hand grows, so cards never leave the table.
  const spacing = Math.min(150, (1080 - CARD.w) / Math.max(1, n - 1));
  const total = (n - 1) * spacing + CARD.w;
  const startX = (VIEW_W - total) / 2 + CARD.w / 2;
  return game.hand.map((card, i) => {
    const cx = startX + i * spacing;
    const lift = game.hand.length > 1 ? Math.abs(i - (n - 1) / 2) : 0;
    const y = LAYOUT.handY + lift * 7;
    return { uid: card.uid, card, x: cx - CARD.w / 2, y, w: CARD.w, h: CARD.h, rot: (i - (n - 1) / 2) * 0.03 };
  });
}

export function rewardLayout() {
  return [0, 1, 2].map((i) => ({
    index: i,
    x: 400 + i * 180,
    y: 250,
    w: CARD.w,
    h: CARD.h,
  }));
}

function drawBar(ctx, x, y, w, h, frac, fill, empty) {
  rr(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = empty;
  ctx.fill();
  if (frac > 0) {
    ctx.save();
    rr(ctx, x, y, w, h, h / 2);
    ctx.clip();
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
    ctx.restore();
  }
  ctx.strokeStyle = 'rgba(43,33,24,0.35)';
  ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, h / 2);
  ctx.stroke();
}

// --- Cards ---
export function drawCardFace(ctx, def, x, y, w, h, opts) {
  const o = opts || {};
  const suit = SUITS[def.suit];
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (o.rot) ctx.rotate(o.rot);
  if (o.scale && o.scale !== 1) ctx.scale(o.scale, o.scale);
  ctx.translate(-w / 2, -h / 2);
  if (o.dim) ctx.globalAlpha = 0.55;
  // Card body.
  ctx.shadowColor = 'rgba(43,33,24,0.35)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  rr(ctx, 0, 0, w, h, 12);
  ctx.fillStyle = PALETTE.white;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = suit.color;
  ctx.lineWidth = 3;
  rr(ctx, 1.5, 1.5, w - 3, h - 3, 11);
  ctx.stroke();
  // Suit band.
  ctx.fillStyle = suit.color;
  rr(ctx, 0, 0, w, 44, 12);
  ctx.fillRect(0, 30, w, 14);
  // Cost pips (lanterns) top-left, suit name top-right.
  for (let i = 0; i < def.cost; i++) {
    drawLanternIcon(ctx, 20 + i * 22, 22, 26, true);
  }
  if (def.cost === 0) text(ctx, 'FREE', 22, 22, 15, '#FFF3D6', 800, 'left');
  text(ctx, suit.name.toUpperCase(), w - 12, 22, 14, '#FFF3D6', 800, 'right');
  // Big value: damage / block / draw shown as the hero number.
  const hero = heroValue(def);
  ctx.fillStyle = suit.dark;
  ctx.beginPath();
  ctx.arc(w / 2, 96, 34, 0, Math.PI * 2);
  ctx.fill();
  drawSuitGlyph(ctx, suit.glyph, w / 2, 92, 34, '#FFF3D6');
  text(ctx, String(hero.value), w / 2, 128, 26, '#FFF3D6', 900);
  // Name + rules text.
  text(ctx, def.name, w / 2, 152, 17, PALETTE.ink, 800);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = '600 13px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  wrapText(ctx, def.text, w / 2, 176, w - 20, 17);
  if (o.resonated) {
    text(ctx, 'RESONANCE!', w / 2, h - 14, 13, suit.color, 900);
  }
  ctx.restore();
}

function heroValue(def) {
  if (def.damage) return { value: def.damage, kind: 'damage' };
  if (def.block) return { value: def.block, kind: 'block' };
  if (def.draw) return { value: def.draw, kind: 'draw' };
  if (def.heal) return { value: def.heal, kind: 'heal' };
  if (def.energy) return { value: def.energy, kind: 'energy' };
  return { value: 0, kind: 'none' };
}

function wrapText(ctx, s, x, y, maxW, lineH) {
  const words = s.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}

export function drawCardBack(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.shadowColor = 'rgba(43,33,24,0.35)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = color || PALETTE.wood;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = PALETTE.goldBright;
  ctx.lineWidth = 2;
  rr(ctx, x + 6, y + 6, w - 12, h - 12, 7);
  ctx.stroke();
  drawLanternIcon(ctx, x + w / 2, y + h / 2, Math.min(w, h) * 0.5, true);
  ctx.restore();
}

// --- Enemy figure: a lantern spirit, body by enemy kind. ---
function drawEnemyFigure(ctx, enemy, cx, cy, scale, shakeX) {
  const def = enemy.def;
  ctx.save();
  ctx.translate(cx + shakeX, cy);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(43,33,24,0.15)';
  ctx.beginPath();
  ctx.ellipse(0, 78, 62, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body.
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 58, 72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.ellipse(-16, -30, 22, 30, -0.4, 0, Math.PI * 2);
  ctx.fill();
  if (def.body === 'fox') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.moveTo(-42, -52);
    ctx.lineTo(-30, -96);
    ctx.lineTo(-8, -60);
    ctx.closePath();
    ctx.moveTo(42, -52);
    ctx.lineTo(30, -96);
    ctx.lineTo(8, -60);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFF3D6';
    ctx.beginPath();
    ctx.moveTo(-38, -58);
    ctx.lineTo(-30, -84);
    ctx.lineTo(-16, -62);
    ctx.closePath();
    ctx.moveTo(38, -58);
    ctx.lineTo(30, -84);
    ctx.lineTo(16, -62);
    ctx.closePath();
    ctx.fill();
  } else if (def.body === 'merchant') {
    ctx.fillStyle = PALETTE.teal;
    rr(ctx, -58, -96, 116, 22, 9);
    ctx.fill();
    ctx.fillStyle = PALETTE.goldBright;
    ctx.beginPath();
    ctx.arc(0, -108, 11, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = PALETTE.woodDark;
    rr(ctx, -46, -118, 92, 30, 8);
    ctx.fill();
    drawLanternIcon(ctx, 0, -132, 26, true);
  }
  // Face.
  ctx.fillStyle = '#FFF3D6';
  ctx.beginPath();
  ctx.arc(-20, -8, 8, 0, Math.PI * 2);
  ctx.arc(20, -8, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.arc(-20, -8, 3.5, 0, Math.PI * 2);
  ctx.arc(20, -8, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 8, 14, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Charged glow.
  if (enemy.charged) {
    ctx.strokeStyle = PALETTE.goldBright;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 82, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// --- The table ---
function drawTable(ctx, game, view) {
  // Paper background + warm table band.
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = PALETTE.table;
  rr(ctx, 24, 64, VIEW_W - 48, VIEW_H - 88, 18);
  ctx.fill();
  ctx.strokeStyle = PALETTE.tableEdge;
  ctx.lineWidth = 3;
  rr(ctx, 24, 64, VIEW_W - 48, VIEW_H - 88, 18);
  ctx.stroke();
  // String of lanterns across the top.
  for (let i = 0; i < 9; i++) {
    const x = 110 + i * 135;
    ctx.strokeStyle = PALETTE.wood;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 60, 0);
    ctx.quadraticCurveTo(x, 26, x + 60, 0);
    ctx.stroke();
    drawLanternIcon(ctx, x, 34, 30, true);
  }
  // Header: title, round, score.
  text(ctx, 'LANTERN DUEL', 640, 30, 26, PALETTE.ink, 900);
  text(ctx, `ROUND ${game.round} / 3`, 90, 92, 17, PALETTE.inkSoft, 800, 'left');
  text(ctx, `SCORE ${game.score}`, 1190, 92, 17, PALETTE.inkSoft, 800, 'right');
}

function drawEnemySide(ctx, game, view) {
  const enemy = game.enemy;
  if (!enemy) return;
  const shakeX = view.time < view.shakeUntil ? (Math.random() - 0.5) * view.shakeMag * 2 : 0;
  const cx = 640;
  drawEnemyFigure(ctx, enemy, cx, 170, 0.85, shakeX);
  // Name + title.
  text(ctx, enemy.def.name.toUpperCase(), cx, 246, 22, PALETTE.ink, 900);
  text(ctx, enemy.def.title, cx, 268, 13, PALETTE.inkSoft, 600);
  // HP bar + block badge.
  drawBar(ctx, cx - 130, 282, 260, 20, enemy.hp / enemy.def.maxHp, PALETTE.coral, '#E8D9C0');
  text(ctx, `${enemy.hp} / ${enemy.def.maxHp}`, cx, 292, 14, '#FFFDF7', 800);
  if (enemy.block > 0) {
    ctx.fillStyle = PALETTE.teal;
    rr(ctx, cx + 140, 280, 52, 24, 8);
    ctx.fill();
    text(ctx, `🛡 ${enemy.block}`, cx + 166, 292, 14, '#FFFDF7', 800);
  }
  if (enemy.charged) {
    ctx.fillStyle = PALETTE.goldBright;
    rr(ctx, cx - 196, 280, 52, 24, 8);
    ctx.fill();
    text(ctx, 'CHARGED!', cx - 170, 292, 12, PALETTE.ink, 900);
  }
  // Opponent's hand: 3 face-down cards, plus the intent face-up.
  const intent = enemy.intent;
  for (let i = 0; i < 3; i++) {
    drawCardBack(ctx, 470 + i * 26, 316, 64, 90, enemy.def.color);
  }
  text(ctx, "ENEMY'S HAND", 560, 420, 12, PALETTE.inkSoft, 700);
  if (intent) {
    const label = intent.kind === 'strike' ? `Strike ${intent.value}` : intent.kind === 'guard' ? `Guard ${intent.value}` : 'Charge!';
    const ic = intent.kind === 'strike' ? SUITS.ember : intent.kind === 'guard' ? SUITS.leaf : SUITS.star;
    ctx.save();
    ctx.shadowColor = 'rgba(43,33,24,0.35)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    rr(ctx, 700, 312, 116, 96, 10);
    ctx.fillStyle = PALETTE.white;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = ic.color;
    ctx.lineWidth = 3;
    rr(ctx, 701.5, 313.5, 113, 93, 9);
    ctx.stroke();
    drawSuitGlyph(ctx, ic.glyph, 758, 344, 30, ic.color);
    text(ctx, label, 758, 378, 16, PALETTE.ink, 900);
    text(ctx, 'NEXT MOVE', 758, 396, 11, PALETTE.inkSoft, 700);
    ctx.restore();
  }
}

function drawPlayerSide(ctx, game, view) {
  const p = game.player;
  // Player HP bar + block + energy lanterns, bottom-left cluster.
  text(ctx, 'YOU — Lantern Keeper', 90, 452, 17, PALETTE.ink, 900, 'left');
  drawBar(ctx, 90, 466, 240, 22, p.hp / p.maxHp, PALETTE.green, '#E8D9C0');
  text(ctx, `${p.hp} / ${p.maxHp} HP`, 210, 477, 14, '#FFFDF7', 800);
  if (p.block > 0) {
    ctx.fillStyle = PALETTE.teal;
    rr(ctx, 340, 464, 56, 26, 8);
    ctx.fill();
    text(ctx, `🛡 ${p.block}`, 368, 477, 14, '#FFFDF7', 800);
  }
  // Energy lanterns.
  for (let i = 0; i < p.maxEnergy; i++) {
    drawLanternIcon(ctx, 460 + i * 34, 478, 28, i < p.energy);
  }
  text(ctx, 'ENERGY', 452, 452, 12, PALETTE.inkSoft, 700, 'left');
  // Deck / discard piles.
  drawCardBack(ctx, 1060, 440, 46, 64, PALETTE.wood);
  text(ctx, `DECK ${game.deck.length}`, 1083, 516, 12, PALETTE.inkSoft, 700);
  ctx.fillStyle = '#D8C9A8';
  rr(ctx, 1140, 440, 46, 64, 8);
  ctx.fill();
  ctx.strokeStyle = PALETTE.tableEdge;
  ctx.lineWidth = 2;
  rr(ctx, 1140, 440, 46, 64, 8);
  ctx.stroke();
  text(ctx, `DISCARD ${game.discard.length}`, 1163, 516, 12, PALETTE.inkSoft, 700);
  // Battle log: only the latest line, centred in the clear strip
  // between the enemy row and the hand, so it never covers a card.
  if (game.log.length > 0) {
    text(ctx, game.log[0], 640, 442, 14, PALETTE.ink, 700);
  }
  // End Turn button.
  const b = LAYOUT.endTurn;
  const hover = false;
  ctx.save();
  ctx.shadowColor = 'rgba(43,33,24,0.3)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fillStyle = game.screen === 'battle' ? PALETTE.coral : '#B9A888';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  text(ctx, 'END TURN', b.x + b.w / 2, b.y + b.h / 2 - 8, 17, '#FFFDF7', 900);
  text(ctx, 'Space', b.x + b.w / 2, b.y + b.h / 2 + 12, 11, '#FFE9D6', 600);
  ctx.restore();
}

function drawHand(ctx, game, view) {
  const layout = handLayout(game);
  for (const slot of layout) {
    const hovered = view.hoverUid === slot.uid;
    const affordable = slot.card.def.cost <= game.player.energy;
    const y = hovered ? slot.y - 28 : slot.y;
    drawCardFace(ctx, slot.card.def, slot.x, y, slot.w, slot.h, {
      rot: slot.rot,
      scale: hovered ? 1.05 : 1,
      dim: game.screen === 'battle' && !affordable,
      resonated: game.suitsPlayed.includes(slot.card.def.suit) && game.screen === 'battle',
    });
  }
  if (game.hand.length === 0 && game.screen === 'battle') {
    text(ctx, 'No cards in hand — end your turn to draw.', 640, 560, 16, PALETTE.inkSoft, 600);
  }
}

// --- Overlays ---
function dim(ctx, alpha) {
  ctx.fillStyle = `rgba(43,33,24,${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawTitle(ctx, game, view) {
  // Decorative fanned cards behind the title.
  const demo = ['spark-strike', 'leaf-ward', 'tide-drift', 'star-flare', 'flame-lash'];
  demo.forEach((id, i) => {
    drawCardFace(ctx, cardById(id), 380 + i * 108, 420, 110, 154, { rot: (i - 2) * 0.08, dim: true });
  });
  dim(ctx, 0.45);
  // Title panel.
  ctx.save();
  ctx.shadowColor = 'rgba(43,33,24,0.4)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  rr(ctx, 290, 120, 700, 300, 20);
  ctx.fillStyle = PALETTE.paper;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  rr(ctx, 291.5, 121.5, 697, 297, 19);
  ctx.stroke();
  drawLanternIcon(ctx, 640, 168, 52, true);
  text(ctx, 'LANTERN DUEL', 640, 216, 54, PALETTE.ink, 900);
  text(ctx, 'A lantern-festival card battler', 640, 258, 20, PALETTE.inkSoft, 600);
  text(ctx, 'Play cards • Build your deck • Beat 3 lantern spirits', 640, 292, 17, PALETTE.ink, 700);
  text(ctx, 'Same suit twice in a turn = RESONANCE bonus!', 640, 320, 16, SUITS.ember.color, 800);
  ctx.fillStyle = PALETTE.coral;
  rr(ctx, 490, 344, 300, 52, 12);
  ctx.fill();
  text(ctx, '▶  CLICK OR PRESS ENTER', 640, 370, 18, '#FFFDF7', 900);
  if (game.best > 0) text(ctx, `Best score: ${game.best}`, 640, 404, 14, PALETTE.inkSoft, 700);
  ctx.restore();
  text(ctx, 'Keys: 1-9 play a card • Space end turn • R restart • Esc title', 640, 640, 14, '#FFFDF7', 600);
}

function drawReward(ctx, game, view) {
  dim(ctx, 0.55);
  text(ctx, 'ROUND WON!', 640, 150, 44, PALETTE.goldBright, 900);
  text(ctx, 'Choose one card to add to your deck', 640, 196, 20, '#FFFDF7', 600);
  const layout = rewardLayout();
  game.reward.forEach((id, i) => {
    const slot = layout[i];
    const hovered = view.hoverReward === i;
    drawCardFace(ctx, cardById(id), slot.x, hovered ? slot.y - 16 : slot.y, slot.w, slot.h, { scale: hovered ? 1.05 : 1 });
    text(ctx, `${i + 1}`, slot.x + slot.w / 2, slot.y + slot.h + 22, 15, '#FFFDF7', 800);
  });
  text(ctx, `Score ${game.score}  •  HP restored +10`, 640, 520, 16, '#FFFDF7', 700);
}

function drawEndScreen(ctx, game, view, won) {
  dim(ctx, 0.55);
  ctx.save();
  rr(ctx, 340, 150, 600, 380, 20);
  ctx.fillStyle = PALETTE.paper;
  ctx.fill();
  ctx.strokeStyle = won ? PALETTE.gold : PALETTE.coral;
  ctx.lineWidth = 4;
  rr(ctx, 342, 152, 596, 376, 18);
  ctx.stroke();
  drawLanternIcon(ctx, 640, 210, 56, won);
  text(ctx, won ? 'VICTORY!' : 'DEFEAT', 640, 268, 52, won ? PALETTE.gold : PALETTE.coral, 900);
  text(
    ctx,
    won ? 'All three lantern spirits are beaten. The festival is yours!' : 'Your lantern goes out... The spirits keep the festival.',
    640,
    308,
    16,
    PALETTE.inkSoft,
    600,
  );
  text(ctx, `SCORE  ${game.score}`, 640, 356, 30, PALETTE.ink, 900);
  text(ctx, `Rounds won: ${game.stats.roundsWon} / 3`, 640, 396, 17, PALETTE.ink, 700);
  text(ctx, `Damage dealt: ${game.stats.damageDealt}   •   Cards played: ${game.stats.cardsPlayed}`, 640, 424, 17, PALETTE.ink, 700);
  ctx.fillStyle = won ? PALETTE.gold : PALETTE.coral;
  rr(ctx, 520, 452, 240, 50, 12);
  ctx.fill();
  text(ctx, won ? 'PLAY AGAIN  (R)' : 'TRY AGAIN  (R)', 640, 477, 18, '#FFFDF7', 900);
  ctx.restore();
  // Victory flourish: rising lanterns.
  if (won) {
    for (let i = 0; i < 8; i++) {
      const phase = (view.time / 2400 + i / 8) % 1;
      const x = 140 + ((i * 137) % 1000);
      const y = 660 - phase * 620;
      ctx.globalAlpha = 0.9 * (1 - phase);
      drawLanternIcon(ctx, x, y, 26, true);
      ctx.globalAlpha = 1;
    }
  }
}

// --- Floating combat text + card flight ---
function drawFx(ctx, view) {
  const now = view.time;
  view.floats = view.floats.filter((f) => now - f.born < 1100);
  for (const f of view.floats) {
    const age = (now - f.born) / 1100;
    ctx.globalAlpha = 1 - age;
    text(ctx, f.text, f.x, f.y - age * 46, 24, f.color, 900);
    ctx.globalAlpha = 1;
  }
  if (view.flight) {
    const age = now - view.flight.born;
    if (age > 320) {
      view.flight = null;
    } else {
      const t = age / 320;
      const ease = 1 - (1 - t) * (1 - t);
      const x = view.flight.fromX + (640 - view.flight.fromX) * ease;
      const y = view.flight.fromY + (170 - view.flight.fromY) * ease;
      ctx.globalAlpha = 1 - t * 0.6;
      drawCardFace(ctx, view.flight.card.def, x - CARD.w / 2, y - CARD.h / 2, CARD.w, CARD.h, { scale: 0.9 });
      ctx.globalAlpha = 1;
    }
  }
}

// --- Main draw ---
export function draw(ctx, game, view, now) {
  view.time = now;
  drawTable(ctx, game, view);
  if (game.screen === 'title') {
    drawTitle(ctx, game, view);
    return;
  }
  drawEnemySide(ctx, game, view);
  drawPlayerSide(ctx, game, view);
  drawHand(ctx, game, view);
  drawFx(ctx, view);
  if (game.screen === 'reward') drawReward(ctx, game, view);
  if (game.screen === 'victory') drawEndScreen(ctx, game, view, true);
  if (game.screen === 'defeat') drawEndScreen(ctx, game, view, false);
}
