import { useEffect, useReducer } from 'react';
import { DEFAULT_BET, MAX_PLAYERS, type GameState, type Player } from '../types';

export const STORAGE_KEY = 'otona-janken:state:v1';
export const MIN_PLAYERS = 2;

type View = GameState['view'];

export type Action =
  | { type: 'addPlayer'; bet?: number } // bet 省略時は DEFAULT_BET（一括変更後はその値を渡す）
  | { type: 'removePlayer'; id: string }
  | { type: 'movePlayer'; from: number; to: number }
  | { type: 'renamePlayer'; id: string; name: string }
  | { type: 'setBet'; id: string; bet: number }
  | { type: 'setAllBets'; bet: number }
  | { type: 'addLoss'; id: string }
  | { type: 'removeLoss'; id: string }
  | { type: 'undo' }
  | { type: 'setView'; view: View }
  | { type: 'newGame' }
  | { type: 'resetLosses' };

const VIEWS: readonly View[] = ['setup', 'game', 'settle'];

// BETは0以上の整数に丸める
const toBet = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);

const newPlayer = (bet: number = DEFAULT_BET): Player => ({
  id: crypto.randomUUID(),
  name: '',
  bet: toBet(bet),
});

export function createInitialState(): GameState {
  return {
    version: 1,
    players: [newPlayer(), newPlayer()],
    history: [],
    view: 'setup',
    updatedAt: Date.now(),
  };
}

function update(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'addPlayer':
      if (state.players.length >= MAX_PLAYERS) return state;
      return { ...state, players: [...state.players, newPlayer(action.bet)] };

    case 'removePlayer':
      if (state.players.length <= MIN_PLAYERS) return state;
      if (!state.players.some((p) => p.id === action.id)) return state;
      return {
        ...state,
        players: state.players.filter((p) => p.id !== action.id),
        history: state.history.filter((id) => id !== action.id),
      };

    case 'movePlayer': {
      const { from, to } = action;
      const n = state.players.length;
      if (from === to || from < 0 || to < 0 || from >= n || to >= n) return state;
      const players = [...state.players];
      const [moved] = players.splice(from, 1);
      players.splice(to, 0, moved);
      return { ...state, players };
    }

    case 'renamePlayer':
      return {
        ...state,
        players: state.players.map((p) => (p.id === action.id ? { ...p, name: action.name } : p)),
      };

    case 'setBet':
      return {
        ...state,
        players: state.players.map((p) => (p.id === action.id ? { ...p, bet: toBet(action.bet) } : p)),
      };

    case 'setAllBets': {
      const bet = toBet(action.bet);
      return { ...state, players: state.players.map((p) => ({ ...p, bet })) };
    }

    case 'addLoss':
      if (!state.players.some((p) => p.id === action.id)) return state;
      return { ...state, history: [...state.history, action.id] };

    case 'removeLoss': {
      const i = state.history.lastIndexOf(action.id);
      if (i < 0) return state;
      return { ...state, history: state.history.filter((_, j) => j !== i) };
    }

    case 'undo':
      if (state.history.length === 0) return state;
      return { ...state, history: state.history.slice(0, -1) };

    case 'setView':
      if (state.view === action.view) return state;
      return { ...state, view: action.view };

    case 'newGame':
      return { ...state, history: [], view: 'setup' };

    case 'resetLosses':
      if (state.history.length === 0) return state;
      return { ...state, history: [] };
  }
}

export function reducer(state: GameState, action: Action): GameState {
  const next = update(state, action);
  return next === state ? state : { ...next, updatedAt: Date.now() };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

const isPlayer = (v: unknown): v is Player =>
  isRecord(v) &&
  typeof v.id === 'string' &&
  v.id !== '' &&
  typeof v.name === 'string' &&
  Number.isInteger(v.bet) &&
  (v.bet as number) >= 0;

// 形式が正しければ GameState を返し、そうでなければ null
export function parseState(raw: string | null): GameState | null {
  if (raw === null) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(data) || data.version !== 1) return null;

  const { players, history, view, updatedAt } = data;
  if (!Array.isArray(players) || players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) return null;
  if (!players.every(isPlayer)) return null;
  const ids = new Set(players.map((p) => p.id));
  if (ids.size !== players.length) return null;
  if (!Array.isArray(history) || !history.every((id) => typeof id === 'string' && ids.has(id))) return null;
  if (!VIEWS.includes(view as View)) return null;
  if (typeof updatedAt !== 'number' || !Number.isFinite(updatedAt)) return null;

  return {
    version: 1,
    players: players.map(({ id, name, bet }) => ({ id, name, bet })),
    history: [...history],
    view: view as View,
    updatedAt,
  };
}

// 壊れたデータ・バージョン不一致・localStorage が使えない場合は初期状態で起動する
export function loadState(): GameState {
  try {
    return parseState(localStorage.getItem(STORAGE_KEY)) ?? createInitialState();
  } catch {
    return createInitialState();
  }
}

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 容量超過・プライベートモード等は保存を諦める（エラーは出さない）
  }
}

export function useGameStore() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  useEffect(() => saveState(state), [state]);
  return [state, dispatch] as const;
}
