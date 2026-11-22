// state.js — the game state machine and turn logic for LANTERN DUEL.
// One job: own the whole game state (title, battle, reward, victory,
// defeat) and every rule that changes it. Rendering and input only
// read this state and call these functions.

import { RULES } from './config.js';
import {
  CATALOGUE,
  buildStartingDeck,
  makeCardInstance,
  resetCardInstances,
  resonanceBonusFor,
} from './cards.js';
import { enemyByRound, pickIntent } from './enemies.js';
import { makeRng, shuffleInPlace } from './random.js';

export function createGame(seed) {
  return {
    seed: seed >>> 0,
    rng: makeRng(seed >>> 0),
    screen: 'title', // title | battle | reward | victory | defeat
    round: 1,
    turn: 1,
    player: { hp: RULES.playerMaxHp, maxHp: RULES.playerMaxHp, block: 0, energy: 0, maxEnergy: RULES.energyPerTurn },
    enemy: null, // { def, hp, block, intent, charged, turn }
    deck: [], // face-down draw pile (card ids)
    hand: [], // card instances
    discard: [], // card ids
    suitsPlayed: [], // suits played this turn, for resonance
    score: 0,
    stats: { damageDealt: 0, cardsPlayed: 0, roundsWon: 0 },
    log: [],
    reward: [], // 3 card ids offered after a round win
    best: 0,
  };
}

export function logLine(game, text) {
  game.log.unshift(text);
  if (game.log.length > 3) game.log.length = 3;
}

export function startRun(game) {
  resetCardInstances();
  game.rng = makeRng(game.seed);
  game.round = 1;
  game.turn = 1;
  game.score = 0;
  game.stats = { damageDealt: 0, cardsPlayed: 0, roundsWon: 0 };
  game.player = { hp: RULES.playerMaxHp, maxHp: RULES.playerMaxHp, block: 0, energy: 0, maxEnergy: RULES.energyPerTurn };
  game.deck = shuffleInPlace(game.rng, buildStartingDeck());
  game.hand = [];
  game.discard = [];
  game.reward = [];
  game.log = [];
  startRound(game, 1);
  logLine(game, 'The festival begins. Play your cards!');
}

function startRound(game, round) {
  const def = enemyByRound(round);
  game.round = round;
  game.turn = 1;
  game.enemy = { def, hp: def.maxHp, block: 0, intent: null, charged: false, turn: 1 };
  game.player.block = 0;
  game.suitsPlayed = [];
  // Reshuffle the whole deck fresh each round, keep the deck built so far.
  const all = game.deck.concat(game.hand.map((c) => c.def.id), game.discard);
  game.deck = shuffleInPlace(game.rng, all.length ? all : buildStartingDeck());
  game.hand = [];
  game.discard = [];
  game.enemy.intent = pickIntent(game.rng, def, 1, def.maxHp);
  game.screen = 'battle';
  beginPlayerTurn(game);
}

function drawCards(game, n) {
  for (let i = 0; i < n; i++) {
    if (game.hand.length >= RULES.handMax) return;
    if (game.deck.length === 0) {
      if (game.discard.length === 0) return;
      game.deck = shuffleInPlace(game.rng, game.discard);
      game.discard = [];
    }
    game.hand.push(makeCardInstance(game.deck.pop()));
  }
}

function beginPlayerTurn(game) {
  game.player.energy = game.player.maxEnergy;
  game.player.block = 0;
  game.suitsPlayed = [];
  drawCards(game, RULES.drawPerTurn);
}

function dealDamageToEnemy(game, amount) {
  let left = amount;
  if (game.enemy.block > 0) {
    const soaked = Math.min(game.enemy.block, left);
    game.enemy.block -= soaked;
    left -= soaked;
  }
  if (left > 0) game.enemy.hp = Math.max(0, game.enemy.hp - left);
  game.stats.damageDealt += amount;
  game.score += amount;
  return left;
}

function dealDamageToPlayer(game, amount) {
  let left = amount;
  if (game.player.block > 0) {
    const soaked = Math.min(game.player.block, left);
    game.player.block -= soaked;
    left -= soaked;
  }
  if (left > 0) game.player.hp = Math.max(0, game.player.hp - left);
  return left;
}

// Play one card from the hand. Returns { ok, reason }.
export function playCard(game, uid) {
  if (game.screen !== 'battle') return { ok: false, reason: 'not in battle' };
  const idx = game.hand.findIndex((c) => c.uid === uid);
  if (idx < 0) return { ok: false, reason: 'card not in hand' };
  const card = game.hand[idx];
  const def = card.def;
  if (def.cost > game.player.energy) return { ok: false, reason: 'not enough energy' };

  game.player.energy -= def.cost;
  game.hand.splice(idx, 1);
  game.discard.push(def.id);
  game.stats.cardsPlayed += 1;

  // Resonance: a second card of the same suit this turn is stronger.
  const resonated = game.suitsPlayed.includes(def.suit);
  const bonus = resonated ? resonanceBonusFor(def.suit) : {};
  game.suitsPlayed.push(def.suit);

  const eff = {
    damage: (def.damage || 0) + (bonus.damage || 0),
    block: (def.block || 0) + (bonus.block || 0),
    draw: (def.draw || 0) + (bonus.draw || 0),
    heal: def.heal || 0,
    energy: (def.energy || 0) + (bonus.energy || 0),
  };

  let dealt = 0;
  if (eff.damage > 0) dealt = dealDamageToEnemy(game, eff.damage);
  if (eff.block > 0) game.player.block += eff.block;
  if (eff.heal > 0) game.player.hp = Math.min(game.player.maxHp, game.player.hp + eff.heal);
  if (eff.energy > 0) game.player.energy += eff.energy;
  if (eff.draw > 0) drawCards(game, eff.draw);

  const bits = [];
  if (eff.damage > 0) bits.push(`${eff.damage} damage`);
  if (eff.block > 0) bits.push(`+${eff.block} block`);
  if (eff.draw > 0) bits.push(`draw ${eff.draw}`);
  if (eff.heal > 0) bits.push(`heal ${eff.heal}`);
  if (eff.energy > 0) bits.push(`+${eff.energy} energy`);
  logLine(game, `${def.name}: ${bits.join(', ')}${resonated ? ' — RESONANCE!' : ''}.`);

  if (game.enemy.hp <= 0) {
    winRound(game);
    return { ok: true, dealt, resonated };
  }
  return { ok: true, dealt, resonated };
}

function winRound(game) {
  game.stats.roundsWon += 1;
  game.score += RULES.roundWinScore;
  if (game.round >= 3) {
    game.screen = 'victory';
    game.best = Math.max(game.best, game.score);
    logLine(game, 'The last lantern burns bright. Victory!');
    return;
  }
  // Offer 3 distinct cards to add to the deck.
  const pool = CATALOGUE.slice();
  shuffleInPlace(game.rng, pool);
  game.reward = pool.slice(0, 3).map((c) => c.id);
  game.screen = 'reward';
  logLine(game, `${game.enemy.def.name} is out! Choose a new card.`);
}

export function chooseReward(game, index) {
  if (game.screen !== 'reward') return false;
  const id = game.reward[index];
  if (!id) return false;
  game.deck.push(id);
  logLine(game, `Added ${id} to your deck.`);
  game.player.hp = Math.min(game.player.maxHp, game.player.hp + RULES.healBetweenRounds);
  startRound(game, game.round + 1);
  return true;
}

// End the player's turn: unplayed cards are discarded (every hand is
// a fresh decision), the enemy acts on its intent, then a new player
// turn begins. Returns the resolved intent for effects.
export function endPlayerTurn(game) {
  if (game.screen !== 'battle') return null;
  const enemy = game.enemy;
  const intent = enemy.intent;
  let resolved = null;

  for (const card of game.hand) game.discard.push(card.def.id);
  game.hand = [];
  game.player.block = 0;
  if (intent.kind === 'strike') {
    let value = intent.value;
    if (enemy.charged) {
      value *= 2;
      enemy.charged = false;
    }
    const hurt = dealDamageToPlayer(game, value);
    resolved = { kind: 'strike', value, hurt };
    logLine(game, `${enemy.def.name} strikes for ${value}!`);
  } else if (intent.kind === 'guard') {
    enemy.block += intent.value;
    resolved = { kind: 'guard', value: intent.value };
    logLine(game, `${enemy.def.name} guards (+${intent.value} block).`);
  } else if (intent.kind === 'charge') {
    enemy.charged = true;
    resolved = { kind: 'charge', value: 0 };
    logLine(game, `${enemy.def.name} is gathering flame... next strike hits DOUBLE!`);
  }

  if (game.player.hp <= 0) {
    game.screen = 'defeat';
    game.best = Math.max(game.best, game.score);
    logLine(game, 'Your lantern goes out...');
    return resolved;
  }

  enemy.turn += 1;
  game.turn += 1;
  enemy.block = 0;
  enemy.intent = pickIntent(game.rng, enemy.def, enemy.turn, enemy.hp);
  beginPlayerTurn(game);
  return resolved;
}

export function backToTitle(game) {
  game.screen = 'title';
}

export function restartRun(game) {
  startRun(game);
}
