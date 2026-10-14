import { describe, expect, it } from 'vitest';
import { DEFAULT_BET, MAX_PLAYERS, type Player, type PlayerResult } from '../types';
import { calcResults } from './calc';
import { settle } from './settle';

const makePlayers = (bets: number[]): Player[] =>
  bets.map((bet, i) => ({ id: `p${i + 1}`, name: `P${i + 1}`, bet }));

// 敗数の配列から history を作る（例: [1, 0, 2] → ['p1', 'p3', 'p3']）
const makeHistory = (losses: number[]): string[] =>
  losses.flatMap((k, i) => Array<string>(k).fill(`p${i + 1}`));

// 再現性のある乱数（mulberry32）
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// 受け渡しを適用した後の各PLAYERの残高
const applyTransfers = (results: PlayerResult[], transfers: ReturnType<typeof settle>) => {
  const balance = new Map(results.map((r) => [r.id, r.net]));
  for (const t of transfers) {
    balance.set(t.from, balance.get(t.from)! + t.amount);
    balance.set(t.to, balance.get(t.to)! - t.amount);
  }
  return [...balance.values()];
};

describe('settle', () => {
  it('シートの再現: 6人・BET 500・敗数1〜6 は3回で清算（支払側の表示順）', () => {
    const results = calcResults(makePlayers(Array(6).fill(500)), makeHistory([1, 2, 3, 4, 5, 6]));
    expect(settle(results)).toEqual([
      { from: 'p4', to: 'p3', amount: 300 },
      { from: 'p5', to: 'p2', amount: 900 },
      { from: 'p6', to: 'p1', amount: 1500 },
    ]);
  });

  it('BETが異なる: 3人・BET 100/200/300・敗数1/1/0 は1回', () => {
    const results = calcResults(makePlayers([100, 200, 300]), makeHistory([1, 1, 0]));
    expect(settle(results)).toEqual([{ from: 'p2', to: 'p3', amount: 150 }]);
  });

  it('全員0敗: 初期状態（2人・BET 100）は0回', () => {
    const results = calcResults(makePlayers([DEFAULT_BET, DEFAULT_BET]), []);
    expect(settle(results)).toEqual([]);
  });

  it('2人: BET 100・敗数3/1 は1回', () => {
    const results = calcResults(makePlayers([100, 100]), makeHistory([3, 1]));
    expect(settle(results)).toEqual([{ from: 'p1', to: 'p2', amount: 200 }]);
  });

  it('不変条件: ランダム入力100通り', () => {
    const rand = rng(2);
    const int = (max: number) => Math.floor(rand() * (max + 1));
    for (let c = 0; c < 100; c++) {
      const n = 2 + int(MAX_PLAYERS - 2);
      const players = makePlayers(Array.from({ length: n }, () => int(1000)));
      const history = Array.from({ length: int(50) }, () => players[int(n - 1)].id);
      const results = calcResults(players, history);
      const transfers = settle(results);

      expect(transfers.length).toBeLessThanOrEqual(n - 1);
      for (const t of transfers) {
        expect(t.amount).toBeGreaterThan(0);
        expect(Number.isInteger(t.amount)).toBe(true);
      }
      expect(applyTransfers(results, transfers)).toEqual(Array(n).fill(0));
    }
  });
});
