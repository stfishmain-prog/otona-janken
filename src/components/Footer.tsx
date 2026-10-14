import { useLang, useT } from '../i18n';
import AdSlot from './AdSlot';

// 使い方・プライバシーポリシーは public/ の静的ページ（日本語・英語）。日本語以外は英語の節へ飛ばす（design.md 9章）
export default function Footer() {
  const t = useT();
  const hash = useLang() === 'ja' ? '' : '#en';

  return (
    <footer className="site-footer">
      <AdSlot placement="footer" />
      <nav>
        <ul className="site-footer__links">
          <li>
            <a href={`/guide.html${hash}`}>{t('footer.guide')}</a>
          </li>
          <li>
            <a href={`/privacy.html${hash}`}>{t('footer.privacy')}</a>
          </li>
        </ul>
      </nav>
      <p className="site-footer__note">{t('footer.note')}</p>
    </footer>
  );
}
