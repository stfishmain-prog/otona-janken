import { useT } from '../i18n';
import AdSlot from './AdSlot';

// 使い方・プライバシーポリシーへのリンクは、各ページを用意したときにここへ追加する（design.md 9章）
export default function Footer() {
  const t = useT();

  return (
    <footer className="site-footer">
      <AdSlot placement="footer" />
      <p className="site-footer__note">{t('footer.note')}</p>
    </footer>
  );
}
