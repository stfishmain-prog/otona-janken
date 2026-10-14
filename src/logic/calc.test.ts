import { describe, expect, it } from 'vitest';
import { DEFAULT_BET, MAX_PLAYERS, type Player } from '../types';
import { calcResults } from './calc';

const makePlayers = (bets: number[]): Player[] =>
  bets.map((bet, i) => ({ id: `p${i + 1}`, name: `P${i + 1}`, bet }));

// 敗数の配列から history を作る（例: [1, 0, 2] → ['p1', 'p3', 'p3']）
const makeHistory = (losses: number[]): string[] =>
  losses.flatMap((k, i) => Array<string>(k).fill(`p${i + 1}`));

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

// 再現性のある乱数（mulberry32）
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

describe('calcResults', () => {
  it('シートの再現: 6人・BET 500・敗数1〜6', () => {
    const results = calcResults(makePlayers(Array(6).fill(500)), makeHistory([1, 2, 3, 4, 5, 6]));
    expect(results.map((r) => r.net)).toEqual([1500, 900, 300, -300, -900, -1500]);
    expect(results.map((r) => r.fraction)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(results.map((r) => r.losses)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('端数: 7人・BET 500・1人だけ1敗', () => {
    const results = calcResults(makePlayers(Array(7).fill(500)), makeHistory([1, 0, 0, 0, 0, 0, 0]));
    const [loser, ...others] = results;
    expect(others.map((r) => r.gain)).toEqual(Array(6).fill(83));
    expect(loser).toMatchObject({ gain: 0, loss: -500, fraction: 2, net: -498 });
    expect(sum(results.map((r) => r.net))).toBe(0);
  });

  it('端数はまとめて計算: 7人・BET 500・同じ1人が3敗', () => {
    const results = calcResults(makePlayers(Array(7).fill(500)), makeHistory([3, 0, 0, 0, 0, 0, 0]));
    const [loser, ...others] = results;
    expect(others.map((r) => r.gain)).toEqual(Array(6).fill(250));
    expect(loser).toMatchObject({ loss: -1500, fraction: 0, net: -1500 });
  });

  it('BETが異なる: 3人・BET 100/200/300・敗数1/1/0', () => {
    const results = calcResults(makePlayers([100, 200, 300]), makeHistory([1, 1, 0]));
    expect(results.map((r) => r.net)).toEqual([0, -150, 150]);
  });

  it('全員0敗: 初期状態（2人・BET 100）', () => {
    const results = calcResults(makePlayers([DEFAULT_BET, DEFAULT_BET]), []);
    for (const r of results) {
      expect(r).toMatchObject({ losses: 0, gain: 0, loss: 0, fraction: 0, net: 0 });
    }
  });

  it('2人: BET 100・敗数3/1', () => {
    const results = calcResults(makePlayers([100, 100]), makeHistory([3, 1]));
    expect(results.map((r) => r.net)).toEqual([-200, 200]);
  });

  it('不変条件: ランダム入力100通り', () => {
    const rand = rng(1);
    const int = (max: number) => Math.floor(rand() * (max + 1));
    for (let c = 0; c < 100; c++) {
      const n = 2 + int(MAX_PLAYERS - 2);
      const players = makePlayers(Array.from({ length: n }, () => int(1000)));
      const history = Array.from({ length: int(50) }, () => players[int(n - 1)].id);
      const results = calcResults(players, history);

      expect(sum(results.map((r) => r.net))).toBe(0);
      for (const r of results) {
        expect(r.fraction).toBeGreaterThanOrEqual(0);
        expect(r.fraction).toBeLessThan(n - 1);
        expect(r.loss).toBeLessThanOrEqual(0);
        expect(r.net).toBe(r.gain + r.loss + r.fraction);
        expect(Number.isInteger(r.net)).toBe(true);
      }
    }
  });
});
