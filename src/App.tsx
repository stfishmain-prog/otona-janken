import Footer from './components/Footer';
import Game from './components/Game';
import Header from './components/Header';
import Settle from './components/Settle';
import Setup from './components/Setup';
import { useGameStore } from './state/store';
import type { GameState } from './types';

const screens = { setup: Setup, game: Game, settle: Settle } satisfies Record<GameState['view'], unknown>;

export default function App() {
  const [state, dispatch] = useGameStore();
  const Screen = screens[state.view];
  return (
    <div className="app">
      {/* アプリ名はセットアップ画面だけに出す */}
      <Header showTitle={state.view === 'setup'} />
      <Screen state={state} dispatch={dispatch} />
      <Footer />
    </div>
  );
}
