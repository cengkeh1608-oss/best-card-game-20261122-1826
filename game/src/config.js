// config.js — constants for LANTERN DUEL: canvas size, palette, layout.
// One job: every number and colour the other modules share, in one place.

export const VIEW_W = 1280;
export const VIEW_H = 720;

// Bright high-key lantern-festival palette (cream paper, warm wood,
// teal water, coral ember). Suits are told apart by colour AND shape.
export const PALETTE = {
  paper: '#FBF3E2',
  paperDark: '#F3E7CE',
  table: '#E8D9B8',
  tableEdge: '#C9A86A',
  wood: '#8A5A33',
  woodDark: '#6B4226',
  ink: '#2B2118',
  inkSoft: '#5C4A38',
  muted: '#8A7A64',
  gold: '#D9A441',
  goldBright: '#F2C14E',
  teal: '#2E7D7B',
  tealLight: '#7FC4BD',
  coral: '#E4572E',
  white: '#FFFDF7',
  red: '#C0392B',
  green: '#3E7C4F',
};

export const SUITS = {
  ember: { key: 'ember', name: 'Ember', color: '#E4572E', dark: '#B23A17', glyph: 'flame' },
  tide: { key: 'tide', name: 'Tide', color: '#2E7D7B', dark: '#1E5654', glyph: 'wave' },
  leaf: { key: 'leaf', name: 'Leaf', color: '#3E7C4F', dark: '#2A5537', glyph: 'leaf' },
  star: { key: 'star', name: 'Star', color: '#D9A441', dark: '#9C721F', glyph: 'star' },
};

// Resonance bonus when a second card of the same suit is played in
// the same turn: the bonus rides on the card just played.
export const RESONANCE = {
  ember: { text: 'Resonance: +3 damage', damage: 3 },
  tide: { text: 'Resonance: draw +1', draw: 1 },
  leaf: { text: 'Resonance: +3 block', block: 3 },
  star: { text: 'Resonance: +1 energy', energy: 1 },
};

export const RULES = {
  playerMaxHp: 40,
  energyPerTurn: 3,
  drawPerTurn: 5,
  handMax: 10,
  roundWinScore: 100,
  healBetweenRounds: 6,
};

// Card geometry on the table.
export const CARD = {
  w: 150,
  h: 210,
  rx: 12,
  miniW: 104,
  miniH: 146,
};

export const LAYOUT = {
  enemyY: 96,
  enemyCardY: 250,
  handY: 486,
  handFan: 118,
  logY: 452,
  endTurn: { x: 1120, y: 560, w: 132, h: 56 },
};
