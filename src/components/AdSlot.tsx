import { useEffect, useRef } from 'react';

// 広告はこのコンポーネント1か所に閉じ込める（design.md 9章）
// 本番ビルドで VITE_ADS_ENABLED=true かつ AdSense の ID が揃っているときだけ読み込み、それ以外は何も描画しない
const CLIENT: string = import.meta.env.VITE_ADSENSE_CLIENT ?? '';
const SLOT: string = import.meta.env.VITE_ADSENSE_SLOT ?? '';
const ADS_ENABLED = import.meta.env.PROD && import.meta.env.VITE_ADS_ENABLED === 'true' && CLIENT !== '' && SLOT !== '';

const SCRIPT_ID = 'adsbygoogle-js';

declare global {
  interface Window {
    adsbygoogle?: object[];
  }
}

// AdSense のスクリプトはページ全体で1回だけ読み込む
function loadAdSense() {
  if (document.getElementById(SCRIPT_ID)) return;
  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(CLIENT)}`;
  document.head.appendChild(script);
}

type Props = { placement: 'footer' | 'settle' };

export default function AdSlot({ placement }: Props) {
  const pushed = useRef(false);

  useEffect(() => {
    // StrictMode で effect が2回走っても、同じ枠に2回 push しない
    if (!ADS_ENABLED || pushed.current) return;
    pushed.current = true;
    loadAdSense();
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      // 広告ブロッカー等で失敗しても、枠の高さは確保したまま何もしない
    }
  }, []);

  if (!ADS_ENABLED) return null;
  return (
    <div className={`ad-slot ad-slot--${placement}`}>
      {/* 高さは CSS で固定する。data-ad-format を付けると AdSense が高さを変えて画面がずれるため付けない */}
      <ins className="adsbygoogle ad-slot__ins" data-ad-client={CLIENT} data-ad-slot={SLOT} />
    </div>
  );
}
