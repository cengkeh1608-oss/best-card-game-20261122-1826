// enemies.js — the three opponents of LANTERN DUEL and their AI.
// One job: know each enemy (name, HP, look, move set) and pick its
// next intent. The intent is shown to the player as a face-up card,
// so every enemy choice can be read and countered.

// An intent is one enemy move: { kind, value, label }.
//   strike: deal `value` damage to the player.
//   guard:  gain `value` block.
//   charge: next strike deals double (telegraphed, so the player can
//           pile on block or end the fight fast).
export const ENEMIES = [
  {
    id: 'cinder-fox',
    name: 'Cinder Fox',
    title: 'Trickster of the First Flame',
    maxHp: 44,
    color: '#E4572E',
    body: 'fox',
    moves: [
      { kind: 'strike', value: 9, label: 'Ember Nip', weight: 5 },
      { kind: 'strike', value: 7, label: 'Quick Bite', weight: 3 },
      { kind: 'guard', value: 8, label: 'Curl Up', weight: 2 },
    ],
  },
  {
    id: 'tide-merchant',
    name: 'Tide Merchant',
    title: 'Seller of Borrowed Waves',
    maxHp: 58,
    color: '#2E7D7B',
    body: 'merchant',
    moves: [
      { kind: 'strike', value: 10, label: 'Wave Toll', weight: 4 },
      { kind: 'strike', value: 8, label: 'Coin Toss', weight: 3 },
      { kind: 'guard', value: 10, label: 'Haggle Shield', weight: 3 },
      { kind: 'strike', value: 7, label: 'Undertow', weight: 2 },
    ],
  },
  {
    id: 'lantern-warden',
    name: 'Lantern Warden',
    title: 'Keeper of the Last Light',
    maxHp: 75,
    color: '#8A5A33',
    body: 'warden',
    moves: [
      { kind: 'strike', value: 12, label: 'Lantern Slam', weight: 4 },
      { kind: 'strike', value: 10, label: 'Glimmer Cut', weight: 3 },
      { kind: 'guard', value: 12, label: 'Paper Wall', weight: 3 },
    ],
  },
];

export function enemyByRound(round) {
  return ENEMIES[Math.min(Math.max(round, 1), ENEMIES.length) - 1];
}

// Pick the enemy's next intent. Rules the player can read:
//  - every 3rd turn the enemy charges (no damage that turn), and its
//    next strike hits double — a full turn to pile on block or race it;
//  - below 30% HP it guards more (defensive, scared);
//  - otherwise a weighted pick from its move set.
export function pickIntent(rng, enemy, turn, enemyHp) {
  if (turn % 3 === 0) {
    return { kind: 'charge', value: 0, label: 'Gathering Flame', charged: false };
  }
  const pool = [];
  for (const move of enemy.moves) {
    let weight = move.weight;
    if (move.kind === 'guard' && enemyHp < enemy.maxHp * 0.3) weight += 3;
    if (move.kind === 'strike' && enemyHp < enemy.maxHp * 0.3) weight = Math.max(1, weight - 1);
    for (let i = 0; i < weight; i++) pool.push(move);
  }
  const chosen = pool[Math.floor(rng() * pool.length)];
  return { ...chosen, charged: false };
}
