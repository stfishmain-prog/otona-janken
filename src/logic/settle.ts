import type { PlayerResult, Transfer } from '../types';

type Side = { id: string; order: number; amount: number };

const byAmountDesc = (a: Side, b: Side) => b.amount - a.amount || a.order - b.order;

// 貪欲法で清算する。受け渡し回数は最大でも 人数 − 1 回（design.md 7章）
export function settle(results: PlayerResult[]): Transfer[] {
  const payers: Side[] = [];
  const receivers: Side[] = [];
  results.forEach((r, order) => {
    if (r.net < 0) payers.push({ id: r.id, order, amount: -r.net });
    else if (r.net > 0) receivers.push({ id: r.id, order, amount: r.net });
  });

  const transfers: (Transfer & { order: number })[] = [];
  const pay = (p: Side, r: Side, amount: number) => {
    transfers.push({ from: p.id, to: r.id, amount, order: p.order });
    p.amount -= amount;
    r.amount -= amount;
  };

  // 金額が完全に一致するペアを先に1回で清算する
  for (const p of payers) {
    const r = receivers.find((x) => x.amount > 0 && x.amount === p.amount);
    if (r) pay(p, r, p.amount);
  }

  // 残りは最大の支払側から最大の受取側へ min(両者) を渡す
  let ps = payers.filter((x) => x.amount > 0);
  let rs = receivers.filter((x) => x.amount > 0);
  while (ps.length > 0 && rs.length > 0) {
    ps.sort(byAmountDesc);
    rs.sort(byAmountDesc);
    const p = ps[0];
    const r = rs[0];
    pay(p, r, Math.min(p.amount, r.amount));
    ps = ps.filter((x) => x.amount > 0);
    rs = rs.filter((x) => x.amount > 0);
  }

  // 支払側の表示順で並べる（安定ソートなので同じ支払側の中では発生順を保つ）
  return transfers
    .sort((a, b) => a.order - b.order)
    .map(({ from, to, amount }) => ({ from, to, amount }));
}
