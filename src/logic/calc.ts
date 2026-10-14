import type { Player, PlayerResult } from '../types';

// 敗数は履歴全体からまとめて数え、端数は1ゲームごとではなく合計額で計算する（design.md 7章）
export function calcResults(players: Player[], history: string[]): PlayerResult[] {
  const losses = new Map<string, number>(players.map((p) => [p.id, 0]));
  for (const id of history) {
    const k = losses.get(id);
    if (k !== undefined) losses.set(id, k + 1);
  }

  const others = players.length - 1;
  const totals = players.map((p) => p.bet * (losses.get(p.id) ?? 0));
  const shares = totals.map((d) => (others > 0 ? Math.floor(d / others) : 0));
  const shareSum = shares.reduce((a, b) => a + b, 0);

  return players.map((p, i) => {
    const d = totals[i];
    const gain = shareSum - shares[i];
    const loss = d > 0 ? -d : 0; // -0 を作らない
    // 1人しかいない場合は配る相手がいないので、全額を端数として残す
    const fraction = others > 0 ? d % others : d;
    return {
      id: p.id,
      name: p.name,
      bet: p.bet,
      losses: losses.get(p.id) ?? 0,
      gain,
      loss,
      fraction,
      net: gain + loss + fraction,
    };
  });
}
