// cards.js — the card catalogue and deck building for LANTERN DUEL.
// One job: know every card (id, suit, cost, effect, art words) and
// build decks. Effects are plain data: { damage, block, draw, heal,
// energy } so the state module can apply them without knowing cards.

// Card effects: damage = hurt the enemy, block = shield yourself,
// draw = pull cards, heal = restore HP, energy = lanterns this turn.
export const CATALOGUE = [
  { id: 'spark-strike', name: 'Spark Strike', suit: 'ember', cost: 1, damage: 6, text: 'Deal 6 damage.' },
  { id: 'ember-ash', name: 'Ember Ash', suit: 'ember', cost: 0, damage: 3, text: 'Deal 3 damage.' },
  { id: 'flame-lash', name: 'Flame Lash', suit: 'ember', cost: 2, damage: 11, text: 'Deal 11 damage.' },
  { id: 'cinder-burst', name: 'Cinder Burst', suit: 'ember', cost: 2, damage: 7, draw: 1, text: 'Deal 7 damage. Draw 1.' },
  { id: 'tide-ebb', name: 'Tide Ebb', suit: 'tide', cost: 0, draw: 1, text: 'Draw 1 card.' },
  { id: 'tide-drift', name: 'Tide Drift', suit: 'tide', cost: 1, draw: 2, text: 'Draw 2 cards.' },
  { id: 'tide-ripple', name: 'Tide Ripple', suit: 'tide', cost: 1, damage: 4, draw: 1, text: 'Deal 4 damage. Draw 1.' },
  { id: 'tide-surge', name: 'Tide Surge', suit: 'tide', cost: 2, draw: 2, energy: 1, text: 'Draw 2 cards. Gain 1 energy.' },
  { id: 'leaf-ward', name: 'Leaf Ward', suit: 'leaf', cost: 1, block: 6, text: 'Gain 6 block.' },
  { id: 'leaf-thorn', name: 'Leaf Thorn', suit: 'leaf', cost: 1, damage: 4, block: 4, text: 'Deal 4 damage. Gain 4 block.' },
  { id: 'leaf-wall', name: 'Leaf Wall', suit: 'leaf', cost: 2, block: 11, text: 'Gain 11 block.' },
  { id: 'leaf-mend', name: 'Leaf Mend', suit: 'leaf', cost: 1, heal: 4, text: 'Heal 4 HP.' },
  { id: 'star-wish', name: 'Star Wish', suit: 'star', cost: 1, draw: 1, energy: 1, text: 'Draw 1 card. Gain 1 energy.' },
  { id: 'star-dazzle', name: 'Star Dazzle', suit: 'star', cost: 1, block: 5, draw: 1, text: 'Gain 5 block. Draw 1.' },
  { id: 'star-flare', name: 'Star Flare', suit: 'star', cost: 2, damage: 8, block: 4, text: 'Deal 8 damage. Gain 4 block.' },
  { id: 'star-lantern', name: 'Star Lantern', suit: 'star', cost: 3, damage: 14, text: 'Deal 14 damage.' },
];

export const CARD_BY_ID = new Map(CATALOGUE.map((c) => [c.id, c]));

export function cardById(id) {
  return CARD_BY_ID.get(id);
}

// The starting deck: 12 cards, a little of every suit so resonance
// is reachable from the first hand.
export const STARTING_DECK = [
  'spark-strike', 'spark-strike', 'spark-strike',
  'ember-ash', 'ember-ash',
  'leaf-ward', 'leaf-ward',
  'leaf-thorn',
  'tide-drift', 'tide-drift',
  'tide-ebb',
  'star-wish',
];

export function buildStartingDeck() {
  return STARTING_DECK.slice();
}

// A fresh card instance in a hand or pile: the catalogue entry plus a
// unique instance id so two copies of one card stay distinct.
let nextInstance = 1;
export function makeCardInstance(id) {
  return { uid: nextInstance++, def: cardById(id) };
}

export function resetCardInstances() {
  nextInstance = 1;
}

// Resonance: the second card of a suit played in the same turn gains
// a bonus on top of its own effect. Returns the bonus effect object.
export function resonanceBonusFor(suit) {
  if (suit === 'ember') return { damage: 3 };
  if (suit === 'tide') return { draw: 1 };
  if (suit === 'leaf') return { block: 3 };
  if (suit === 'star') return { energy: 1 };
  return {};
}
