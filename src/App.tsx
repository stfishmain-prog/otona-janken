import type { Dispatch } from 'react';
import Game from './components/Game';
import Setup from './components/Setup';
import { useT } from './i18n';
import { useGameStore, type Action } from './state/store';
import type { GameState } from './types';

type ScreenProps = { state: GameState; dispatch: Dispatch<Action> };

// 仮の画面（中身は後で実装する）
function Settle(_: ScreenProps) {
  const t = useT();
  return <h2>{t('settle.title')}</h2>;
}

const screens = { setup: Setup, game: Game, settle: Settle } satisfies Record<GameState['view'], unknown>;

export default function App() {
  const [state, dispatch] = useGameStore();
  const Screen = screens[state.view];
  return <Screen state={state} dispatch={dispatch} />;
}
