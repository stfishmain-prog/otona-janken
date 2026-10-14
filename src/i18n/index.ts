import { useCallback, useSyncExternalStore } from 'react';
import de from './de.json';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import it from './it.json';
import ja from './ja.json';
import ko from './ko.json';
import nl from './nl.json';
import pt from './pt.json';
import zhCN from './zh-CN.json';
import zhHK from './zh-HK.json';
import zhTW from './zh-TW.json';

export type MessageKey = keyof typeof ja;
type Dict = Partial<Record<MessageKey, string>>;
type Vars = Record<string, string | number>;

// 言語の追加は「JSONファイル1つ追加＋ここに1行」（design.md 8章）
const dictionaries = {
  ja,
  en: en satisfies Record<MessageKey, string>,
  'zh-TW': zhTW satisfies Record<MessageKey, string>,
  'zh-HK': zhHK satisfies Record<MessageKey, string>,
  'zh-CN': zhCN satisfies Record<MessageKey, string>,
  ko: ko satisfies Record<MessageKey, string>,
  pt: pt satisfies Record<MessageKey, string>,
  de: de satisfies Record<MessageKey, string>,
  fr: fr satisfies Record<MessageKey, string>,
  es: es satisfies Record<MessageKey, string>,
  it: it satisfies Record<MessageKey, string>,
  nl: nl satisfies Record<MessageKey, string>,
} satisfies Record<string, Dict>;

export type Lang = keyof typeof dictionaries;

const LANG_KEY = 'otona-janken:lang';
const DEFAULT_LANG: Lang = 'ja';
const FALLBACK_LANG = 'en';

const isLang = (v: unknown): v is Lang => typeof v === 'string' && Object.hasOwn(dictionaries, v);

export const languages = Object.keys(dictionaries) as Lang[];

// ブラウザの言語タグを辞書に対応付ける。地域付き（zh-TW 等）→ 中国語は字体で判定 → 言語のみ
function matchLang(tag: string): Lang | undefined {
  let locale: Intl.Locale;
  try {
    locale = new Intl.Locale(tag).maximize(); // zh → zh-Hans-CN, zh-Hant → zh-Hant-TW
  } catch {
    return undefined;
  }
  const { language, script, region } = locale;
  const regional = `${language}-${region}`;
  if (isLang(regional)) return regional;
  if (language === 'zh') {
    if (script === 'Hant') return region === 'MO' ? 'zh-HK' : 'zh-TW';
    return 'zh-CN'; // 簡体字（zh-SG 等）
  }
  return isLang(language) ? language : undefined;
}

// 保存済み設定 → ブラウザの言語 → 日本語
function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (isLang(saved)) return saved;
  } catch {
    // localStorage が使えない環境は無視
  }
  if (typeof navigator !== 'undefined') {
    for (const tag of navigator.languages ?? [navigator.language]) {
      const lang = tag ? matchLang(tag) : undefined;
      if (lang) return lang;
    }
  }
  return DEFAULT_LANG;
}

let current: Lang = detectLang();
const listeners = new Set<() => void>();

// 該当言語 → 英語 → 日本語 の順に探し、無ければキーをそのまま返す
function lookup(lang: Lang, key: MessageKey): string {
  const chain: string[] = [lang, FALLBACK_LANG, DEFAULT_LANG];
  for (const l of chain) {
    const dict: Dict | undefined = (dictionaries as Record<string, Dict>)[l];
    const msg = dict?.[key];
    if (msg !== undefined) return msg;
  }
  return key;
}

const interpolate = (msg: string, vars?: Vars) =>
  vars ? msg.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : msg;

const translate = (lang: Lang, key: MessageKey, vars?: Vars) => interpolate(lookup(lang, key), vars);

export function t(key: MessageKey, vars?: Vars): string {
  return translate(current, key, vars);
}

// 言語名はその言語自身の辞書から取る（例: 日本語, English）
export function languageName(lang: Lang): string {
  return translate(lang, 'header.langName');
}

export function formatNumber(n: number, lang: Lang = current): string {
  return new Intl.NumberFormat(lang).format(n);
}

// <html lang> とページタイトルを現在の言語に合わせる
function applyDocument(lang: Lang) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.title = translate(lang, 'app.name');
}

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang): void {
  if (lang === current) return;
  current = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // 保存できなくても切替自体は行う
  }
  applyDocument(lang);
  listeners.forEach((l) => l());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, getLang);
}

// 言語切替で再描画されるように、現在の言語に束縛した t を返す
export function useT() {
  const lang = useLang();
  return useCallback((key: MessageKey, vars?: Vars) => translate(lang, key, vars), [lang]);
}

applyDocument(current);
