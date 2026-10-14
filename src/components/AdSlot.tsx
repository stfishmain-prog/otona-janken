// 広告はこのコンポーネント1か所に閉じ込める（design.md 9章）
// 初版は広告コードを入れず、VITE_ADS_ENABLED=true のときだけ高さ固定の枠を確保する
const ADS_ENABLED = import.meta.env.VITE_ADS_ENABLED === 'true';

type Props = { placement: 'footer' | 'settle' };

export default function AdSlot({ placement }: Props) {
  if (!ADS_ENABLED) return null;
  return <div className={`ad-slot ad-slot--${placement}`} aria-hidden="true" />;
}
