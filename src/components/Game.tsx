import { useMemo, type Dispatch } from 'react';
import { formatNumber, useLang, useT, type Lang } from '../i18n';
import { calcResults } from '../logic/calc';
import type { Action } from '../state/store';
import type { GameState } from '../types';

type Props = { state: GameState; dispatch: Dispatch<Action> };

// 色だけに頼らず符号も付ける（0 は符号なし）
function formatSigned(n: number, lang: Lang): string {
  const abs = formatNumber(Math.abs(n), lang);
  if (n > 0) return `+${abs}`;
  if (n < 0) return `−${abs}`;
  return abs;
}

const netClass = (n: number) => (n > 0 ? 'net net--plus' : n < 0 ? 'net net--minus' : 'net');

export default function Game({ state, dispatch }: Props) {
  const t = useT();
  const lang = useLang();
  const { players, history } = state;
  const results = useMemo(() => calcResults(players, history), [players, history]);

  return (
    <main className="screen screen--game">
      <div className="game-bar">
        <h2 className="screen__title">{t('game.title')}</h2>
        <button type="button" className="btn btn--outline" onClick={() => dispatch({ type: 'setView', view: 'setup' })}>
          {t('game.backToSetup')}
        </button>
      </div>

      <div className="game-bar">
        <span className="game-bar__total">{t('game.totalGames', { count: formatNumber(history.length, lang) })}</span>
        <button
          type="button"
          className="btn btn--outline"
          disabled={history.length === 0}
          onClick={() => dispatch({ type: 'undo' })}
        >
          {t('game.undo')}
        </button>
      </div>

      <p className="hint">{t('game.hint', { addLoss: t('game.addLoss'), undo: t('game.undo') })}</p>

      <ul className="cards">
        {results.map((r, i) => {
          const name = r.name || t('player.defaultName', { n: i + 1 });
          return (
            <li key={r.id} className="card">
              <div className="card__info">
                <span className="card__name">{name}</span>
                <span className="card__losses">{t('game.losses', { count: formatNumber(r.losses, lang) })}</span>
                <span className="card__net">
                  <span className="card__net-label">{t('game.net')}</span>
                  <span className={netClass(r.net)}>
                    {formatSigned(r.net, lang)} {t('common.point')}
                  </span>
                </span>
              </div>
              <div className="card__actions">
                <button
                  type="button"
                  className="btn btn--outline card__minus"
                  aria-label={t('game.removeLossFor', { name })}
                  disabled={r.losses === 0}
                  onClick={() => dispatch({ type: 'removeLoss', id: r.id })}
                >
                  {t('game.removeLoss')}
                </button>
                <button
                  type="button"
                  className="btn btn--primary card__plus"
                  aria-label={t('game.addLossFor', { name })}
                  onClick={() => dispatch({ type: 'addLoss', id: r.id })}
                >
                  {t('game.addLoss')}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="action-bar">
        <button
          type="button"
          className="btn btn--primary btn--block btn--large"
          onClick={() => dispatch({ type: 'setView', view: 'settle' })}
        >
          {t('game.settle')}
        </button>
      </div>
    </main>
  );
}
