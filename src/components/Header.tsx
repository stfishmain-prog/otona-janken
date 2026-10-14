import { languageName, languages, setLang, useLang, useT, type Lang } from '../i18n';

type Props = { showTitle: boolean };

export default function Header({ showTitle }: Props) {
  const t = useT();
  const lang = useLang();

  return (
    <header className="site-header">
      {/* 言語切替（日本語 / English）。タイトルより上の行末に置く */}
      {languages.length > 1 && (
        <select
          className="site-header__lang"
          aria-label={t('header.language')}
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
        >
          {languages.map((l) => (
            <option key={l} value={l}>
              {languageName(l)}
            </option>
          ))}
        </select>
      )}
      {/* 狭い画面では「大人は目的無く」「ジャンケンをしない。」の間だけで改行させる */}
      {showTitle && (
        <h1 className="site-header__title">
          <span>{t('header.titleLine1')}</span>
          <span>{t('header.titleLine2')}</span>
        </h1>
      )}
    </header>
  );
}
