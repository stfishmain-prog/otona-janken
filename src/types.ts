export const DEFAULT_BET = 100;      // 新規PLAYERのBET初期値
export const MAX_PLAYERS = 20;

export type Player = {
  id: string;      // crypto.randomUUID()
  name: string;
  bet: number;     // 0以上の整数（初期値 DEFAULT_BET）
};

export type GameState = {
  version: 1;                         // 保存形式のバージョン（将来の移行用）
  players: Player[];                  // 表示順 = 配列順
  history: string[];                  // 負けたPLAYERのidを1ゲーム1件で追記
  view: 'setup' | 'game' | 'settle';  // 現在の画面
  updatedAt: number;                  // Date.now()
};

// 以下は保存しない（計算結果）
export type PlayerResult = {
  id: string; name: string; bet: number;
  losses: number;    // history 内の出現回数
  gain: number;      // 加点POINT
  loss: number;      // 減点POINT（0以下）
  fraction: number;  // 端数POINT（配らなかった余り。0以上）
  net: number;       // 清算POINT = gain + loss + fraction
};

export type Transfer = { from: string; to: string; amount: number };
