import { useMemo, useState, type Dispatch } from 'react';
import { formatNumber, useLang, useT, type Lang } from '../i18n';
import { calcResults } from '../logic/calc';
import { settle } from '../logic/settle';
import type { Action } from '../state/store';
import type { GameState } from '../types';
import AdSlot from './AdSlot';

type Props = { state: GameState; dispatch: Dispatch<Action> };

type CopyStatus = 'idle' | 'copied' | 'failed';

// 色だけに頼らず符号も付ける（0 は符号なし）
function formatSigned(n: number, lang: Lang): string {
  const abs = formatNumber(Math.abs(n), lang);
  if (n > 0) return `+${abs}`;
  if (n < 0) return `−${abs}`;
  return abs;
}

const netClass = (n: number) => (n > 0 ? 'net net--plus' : n < 0 ? 'net net--minus' : 'net');

const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);

export default function Settle({ state, dispatch }: Props) {
  const t = useT();
  const lang = useLang();
  const { players, history } = state;
  const results = useMemo(() => calcResults(players, history), [players, history]);
  const transfers = useMemo(() => settle(results), [results]);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

  const names = new Map(results.map((r, i) => [r.id, r.name.trim() || t('player.defaultName', { n: i + 1 })]));
  const nameOf = (id: string) => names.get(id) ?? '';

  // S1・S2 と同じく、表示順で PLAYER ごとの色を割り当てる
  const order = new Map(results.map((r, i) => [r.id, i]));
  const accentOf = (id: string) => `accent-${((order.get(id) ?? 0) % 6) + 1}`;

  const transferText = (from: string, to: string, amount: number) =>
    t('settle.transfer', { from: nameOf(from), to: nameOf(to), amount: formatNumber(amount, lang) });

  const copy = async () => {
    const lines = [
      `${t('app.name')} ${t('settle.title')}`,
      t('game.totalGames', { count: formatNumber(history.length, lang) }),
      '',
      ...(transfers.length > 0
        ? transfers.map((tr) => transferText(tr.from, tr.to, tr.amount))
        : [t('settle.noTransfers')]),
      '',
      ...results.map((r) =>
        t('settle.copyNet', { name: nameOf(r.id), net: formatSigned(r.net, lang), point: t('common.point') }),
      ),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  };

  const newGame = () => {
    if (window.confirm(t('settle.confirmNewGame'))) dispatch({ type: 'newGame' });
  };

  return (
    <main className="screen screen--settle">
      <h2 className="screen__title">{t('settle.title')}</h2>

      <section className="settle-section" aria-labelledby="settle-transfers">
        <h3 id="settle-transfers" className="settle-section__title">
          {t('settle.transfers')}
        </h3>
        {transfers.length > 0 ? (
          <ol className="transfers">
            {transfers.map((tr, i) => (
              <li key={i} className="transfer">
                {/* 見た目は名前と金額を分けて並べ、読み上げは1文で伝える */}
                <span className="transfer__visual" aria-hidden="true">
                  <span className={`transfer__name ${accentOf(tr.from)}`}>{nameOf(tr.from)}</span>
                  <span className="transfer__arrow">→</span>
                  <span className={`transfer__name ${accentOf(tr.to)}`}>{nameOf(tr.to)}</span>
                  <span className="transfer__amount">
                    {formatNumber(tr.amount, lang)} {t('common.point')}
                  </span>
                </span>
                <span className="visually-hidden">{transferText(tr.from, tr.to, tr.amount)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="settle-empty">{t('settle.noTransfers')}</p>
        )}
      </section>

      <section className="settle-section" aria-labelledby="settle-breakdown">
        <h3 id="settle-breakdown" className="settle-section__title">
          {t('settle.breakdown')}
        </h3>
        <div className="table-wrap">
          <table className="result-table">
            <thead>
              <tr>
                <th scope="col">{t('settle.col.player')}</th>
                <th scope="col">{t('settle.col.losses')}</th>
                <th scope="col">{t('settle.col.gain')}</th>
                <th scope="col">{t('settle.col.loss')}</th>
                <th scope="col">{t('settle.col.fraction')}</th>
                <th scope="col">{t('settle.col.net')}</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className={accentOf(r.id)}>
                  <th scope="row">{nameOf(r.id)}</th>
                  <td>{formatNumber(r.losses, lang)}</td>
                  <td>{formatSigned(r.gain, lang)}</td>
                  <td>{formatSigned(r.loss, lang)}</td>
                  <td>{formatSigned(r.fraction, lang)}</td>
                  <td className={netClass(r.net)}>{formatSigned(r.net, lang)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">{t('settle.total')}</th>
                <td>{formatNumber(history.length, lang)}</td>
                <td>{formatSigned(sum(results.map((r) => r.gain)), lang)}</td>
                <td>{formatSigned(sum(results.map((r) => r.loss)), lang)}</td>
                <td>{formatSigned(sum(results.map((r) => r.fraction)), lang)}</td>
                <td>{formatSigned(sum(results.map((r) => r.net)), lang)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <div className="settle-actions">
        <button type="button" className="btn btn--primary btn--block btn--large" onClick={copy}>
          {t('settle.copy')}
        </button>
        <p className="settle-actions__status" role="status">
          {copyStatus === 'copied' && t('settle.copied')}
          {copyStatus === 'failed' && t('settle.copyFailed')}
        </p>
        <button
          type="button"
          className="btn btn--outline btn--block btn--large"
          onClick={() => dispatch({ type: 'setView', view: 'game' })}
        >
          {t('settle.backToGame')}
        </button>
        <button type="button" className="btn btn--block btn--large settle-actions__new" onClick={newGame}>
          {t('settle.newGame')}
        </button>
      </div>

      <AdSlot placement="settle" />
    </main>
  );
}
