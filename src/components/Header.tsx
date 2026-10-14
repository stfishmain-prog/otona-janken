import { languages, setLang, useLang, useT, type Lang } from '../i18n';

// 言語名は各言語の自称で表示する（例: 日本語, English）
const nativeName = (lang: Lang) => new Intl.DisplayNames([lang], { type: 'language' }).of(lang) ?? lang;

type Props = { showTitle: boolean };

export default function Header({ showTitle }: Props) {
  const t = useT();
  const lang = useLang();

  return (
    <header className="site-header">
      {/* 狭い画面では「大人は目的無く」「ジャンケンをしない。」の間だけで改行させる */}
      {showTitle && (
        <h1 className="site-header__title">
          <span>{t('header.titleLine1')}</span>
          <span>{t('header.titleLine2')}</span>
        </h1>
      )}
      {/* 言語切替の置き場所。辞書が2つ以上になったら表示される */}
      {languages.length > 1 && (
        <select
          className="site-header__lang"
          aria-label={t('header.language')}
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
        >
          {languages.map((l) => (
            <option key={l} value={l}>
              {nativeName(l)}
            </option>
          ))}
        </select>
      )}
    </header>
  );
}
