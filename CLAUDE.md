# 大人は目的無くジャンケンをしない。 — 敗数からPOINTを清算するWebアプリ

## 仕様
- 仕様は docs/design.md。指示された章だけ読むこと（全文を読まない）。

## 技術
- Vite + React + TypeScript の静的SPA。サーバー・DB・外部APIは使わない。
- 公開先は Cloudflare Workers の静的アセット（wrangler.jsonc）。Workerのコードは書かない。
- スタイルは src/styles.css 1ファイル。CSS変数と論理プロパティ（margin-inline-* 等）を使う。
- 状態は useReducer + localStorage（キー otona-janken:state:v1）。
- テストは Vitest。対象は src/logic/ のみ。

## ルール
- 依存パッケージを追加する前に必ず確認を取る。
- UI文言の直書き禁止。アプリ名も含め t('key') 経由で src/i18n/ja.json に追加する。
- 計算は整数のみ。端数は配らず敗者の端数POINTに残し、清算POINTの合計は常に0（design.md 7章）。
- BET POINTの初期値は100（DEFAULT_BET）、最大人数は20。
- src/logic/ は純粋関数にし、React や localStorage に依存させない。
- 触るファイルは指示された範囲に限る。
- 完了前に npm test と npm run build を実行し、通ることを確認する。
- 報告は簡潔に。変更内容は箇条書き3行以内。

## コマンド
- npm run dev / npm test / npm run build
