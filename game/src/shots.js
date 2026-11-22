// shots.js — deterministic screenshot states for LANTERN DUEL.
// One job: given ?shot=title|battle|win|loss (and ?seed=N), put the
// game into that exact state with settled effects, so a screenshot
// replays byte-for-byte the same table every time. Never used in
// normal play; the query string decides.

import { enemyByRound } from './enemies.js';
import { makeCardInstance } from './cards.js';
import { createGame, logLine, startRun } from './state.js';
import { makeRng } from './random.js';

function buildBattleShot(game) {
  startRun(game);
  // Force round 2 against the Tide Merchant, mid-fight.
  const def = enemyByRound(2);
  game.round = 2;
  game.turn = 4;
  game.player.hp = 32;
  game.player.block = 4;
  game.player.energy = 2;
  game.enemy = {
    def,
    hp: 34,
    block: 5,
    intent: { kind: 'strike', value: 10, label: 'Wave Toll', charged: false },
    charged: false,
    turn: 4,
  };
  game.deck = ['spark-strike', 'leaf-ward', 'tide-drift', 'star-wish', 'ember-ash', 'leaf-thorn', 'tide-ebb'];
  game.discard = ['ember-ash', 'leaf-ward'];
  game.hand = [
    makeCardInstance('flame-lash'),
    makeCardInstance('leaf-ward'),
    makeCardInstance('tide-drift'),
    makeCardInstance('star-flare'),
    makeCardInstance('spark-strike'),
  ];
  game.suitsPlayed = ['ember'];
  game.score = 214;
  game.stats = { damageDealt: 114, cardsPlayed: 9, roundsWon: 1 };
  game.log = [];
  logLine(game, 'Cinder Fox is out! Choose a new card.');
  logLine(game, 'Tide Merchant guards (+10 block).');
  logLine(game, 'Flame Lash: 11 damage. RESONANCE!');
  game.screen = 'battle';
}

function buildWinShot(game) {
  startRun(game);
  game.round = 3;
  game.score = 842;
  game.stats = { damageDealt: 542, cardsPlayed: 61, roundsWon: 3 };
  game.player.hp = 18;
  const def = enemyByRound(3);
  game.enemy = { def, hp: 0, block: 0, intent: null, charged: false, turn: 9 };
  game.screen = 'victory';
  game.best = 842;
}

function buildLossShot(game) {
  startRun(game);
  game.round = 2;
  game.score = 187;
  game.stats = { damageDealt: 87, cardsPlayed: 14, roundsWon: 1 };
  game.player.hp = 0;
  const def = enemyByRound(2);
  game.enemy = {
    def,
    hp: 30,
    block: 0,
    intent: { kind: 'strike', value: 10, label: 'Wave Toll', charged: false },
    charged: false,
    turn: 6,
  };
  game.screen = 'defeat';
  game.best = 187;
}

// Apply a shot from the URL query. Returns the shot name, or '' when
// no shot was requested (normal play).
export function applyShotFromQuery(game, query) {
  const params = new URLSearchParams(query);
  const shot = params.get('shot') || '';
  const seed = Number(params.get('seed') || 7);
  if (!shot) return '';
  game.seed = seed;
  game.rng = makeRng(seed);
  if (shot === 'title') {
    game.screen = 'title';
  } else if (shot === 'battle') {
    buildBattleShot(game);
  } else if (shot === 'win') {
    buildWinShot(game);
  } else if (shot === 'loss') {
    buildLossShot(game);
  } else {
    return '';
  }
  return shot;
}

export function createGameForShot(query) {
  const params = new URLSearchParams(query);
  const seed = Number(params.get('seed') || 7);
  const game = createGame(seed);
  applyShotFromQuery(game, query);
  return game;
}
