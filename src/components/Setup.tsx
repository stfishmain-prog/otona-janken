import { useState, type Dispatch } from 'react';
import { formatNumber, useLang, useT } from '../i18n';
import { MIN_PLAYERS, type Action } from '../state/store';
import { DEFAULT_BET, MAX_PLAYERS, type GameState } from '../types';

type Props = { state: GameState; dispatch: Dispatch<Action> };

const DIGITS = /^\d*$/;

type BetInputProps = { id?: string; value: number; label?: string; onCommit: (bet: number) => void };

// 入力途中の空欄を許し、確定した整数だけを store に渡す
function BetInput({ id, value, label, onCommit }: BetInputProps) {
  const [draft, setDraft] = useState(String(value));
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    setDraft(String(value));
  }

  return (
    <input
      id={id}
      className="input input--bet"
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={9}
      aria-label={label}
      value={draft}
      onChange={(e) => {
        const next = e.target.value;
        if (!DIGITS.test(next)) return;
        setDraft(next);
        if (next !== '') onCommit(Number(next));
      }}
      onBlur={() => setDraft(String(value))}
    />
  );
}

export default function Setup({ state, dispatch }: Props) {
  const t = useT();
  const lang = useLang();
  const { players, history } = state;
  const [bulkBet, setBulkBet] = useState(() =>
    players.every((p) => p.bet === players[0].bet) ? players[0].bet : DEFAULT_BET,
  );

  const defaultName = (i: number) => t('player.defaultName', { n: i + 1 });
  const canAdd = players.length < MAX_PLAYERS;
  const canRemove = players.length > MIN_PLAYERS;

  const remove = (id: string, i: number) => {
    const name = players[i].name.trim() || defaultName(i);
    if (window.confirm(t('setup.confirmRemove', { name }))) dispatch({ type: 'removePlayer', id });
  };

  // 空の名前は「PLAYER n」で補完してから開始する
  const start = () => {
    players.forEach((p, i) => {
      const name = p.name.trim() || defaultName(i);
      if (name !== p.name) dispatch({ type: 'renamePlayer', id: p.id, name });
    });
    dispatch({ type: 'setView', view: 'game' });
  };

  // 日本語以外は使い方ページの英語の節へ飛ばす（Footer と同じ）
  const rulesHref = lang === 'ja' ? '/guide.html#rules' : '/guide.html#rules-en';
  const buttons = { addLoss: t('game.addLoss'), settle: t('game.settle') };

  return (
    <main className="screen screen--setup">
      {/* 初めて開いた人向けの概要。アプリ名のすぐ下に置く */}
      <section className="intro" aria-label={t('setup.intro.label')}>
        <p>{t('setup.intro.summary', buttons)}</p>
        <ol className="intro__steps">
          <li>{t('setup.intro.step1')}</li>
          <li>{t('setup.intro.step2', buttons)}</li>
          <li>{t('setup.intro.step3', buttons)}</li>
        </ol>
        <a className="intro__rules" href={rulesHref}>
          {t('setup.intro.rules')}
        </a>
      </section>

      <h2 className="screen__title">{t('setup.title')}</h2>

      <div className="hinted">
        <p className="hint">{t('setup.betHint')}</p>
        <p className="hint">{t('setup.betNote')}</p>
        <div className="field">
          <label className="field__label" htmlFor="bet-all">
            {t('setup.betAll')}
          </label>
          <BetInput
            id="bet-all"
            value={bulkBet}
            onCommit={(bet) => {
              setBulkBet(bet);
              dispatch({ type: 'setAllBets', bet });
            }}
          />
        </div>
      </div>

      <div className="hinted">
        <p className="hint">
          {t('setup.playersHint', { min: formatNumber(MIN_PLAYERS, lang), max: formatNumber(MAX_PLAYERS, lang) })}
        </p>
        <div className="player-list__head">
          <span>{t('setup.players')}</span>
          <span>
            {t('setup.playerCount', { count: formatNumber(players.length, lang), max: formatNumber(MAX_PLAYERS, lang) })}
          </span>
        </div>
      </div>

      <ol className="player-list">
        {players.map((p, i) => {
          const losses = history.filter((id) => id === p.id).length;
          return (
            <li key={p.id} className="player-row">
              <span className="player-row__no">{formatNumber(i + 1, lang)}</span>
              <input
                className="input player-row__name"
                type="text"
                autoComplete="off"
                aria-label={t('setup.playerName', { n: i + 1 })}
                placeholder={defaultName(i)}
                value={p.name}
                onChange={(e) => dispatch({ type: 'renamePlayer', id: p.id, name: e.target.value })}
              />
              <BetInput
                value={p.bet}
                label={t('setup.playerBet', { n: i + 1 })}
                onCommit={(bet) => dispatch({ type: 'setBet', id: p.id, bet })}
              />
              <button
                type="button"
                className="btn btn--ghost player-row__remove"
                disabled={!canRemove}
                onClick={() => remove(p.id, i)}
              >
                {t('setup.removePlayer')}
              </button>
              {losses > 0 && (
                <span className="player-row__losses">{t('game.losses', { count: formatNumber(losses, lang) })}</span>
              )}
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        className="btn btn--outline btn--block"
        disabled={!canAdd}
        onClick={() => dispatch({ type: 'addPlayer', bet: bulkBet })}
      >
        {t('setup.addPlayer')}
      </button>

      <div className="action-bar">
        <button type="button" className="btn btn--primary btn--block btn--large" onClick={start}>
          {t('setup.start')}
        </button>
      </div>
    </main>
  );
}
