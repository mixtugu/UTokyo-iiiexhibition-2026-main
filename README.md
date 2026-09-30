# iii Exhibition 2026

現在のメイン画面は `reference/preview.html` 統合版を再現しています。`npm run dev` 実行後 <http://127.0.0.1:4323/> で確認してください。オリジナルのスタイル・素材・アニメーションを適用しており、Storybook の **Reference → Exhibition** でも確認できます。同期方法と比較検証については [リファレンス再現ガイド](docs/reference-reproduction.md) を参照してください。

以下のコンポーネント・トークン構成の説明は、以前の実装を保存したものです。現在のメイン画面の実行方法は上記の案内を基準としてください。

東京大学制作展のデザイン・インタラクションプロトタイプです。**Node.js + TypeScript + Tailwind CSS + Vite** を使用し、既存の統合画面のコンテンツとパーティクル・スクロール効果を維持しています。ブラウザコードはフレームワークに依存しない TypeScript の DOM コンポーネントです。Node.js は開発サーバー、ビルド、検証に使用し、別途 API サーバーはありません。

## はじめに

Node.js 24 の使用を推奨します（`.nvmrc`）。

```sh
nvm use
npm ci
npm run dev
```

<http://127.0.0.1:4323/> を開きます。`/preview.html` でも同じ画面を確認できます。`nvm` を使用しない場合は Node.js 24 をインストールしてから `npm ci` を実行してください。HTML の直接実行やソースフォルダの Python サーバーは TypeScript を処理できないため、Vite を使用してください。

## デザイン調整とコンポーネントカタログ

共通のデザイン設定は [`src/design/tokens.css`](src/design/tokens.css) にまとめられています。左右の余白、最大幅、8px 間隔、文字サイズ・行間、レスポンシブ基準、操作領域、画像クロップを変更できます。

```sh
npm run storybook
```

<http://127.0.0.1:6006/> で実際のコンポーネントとセクションを確認し、`Design / Tokens` の Controls で一時的に調整できます。詳しい使い方は [デザイン設定・Storybook ガイド](docs/design-system.md) を確認してください。

## コマンド

| コマンド                  | 用途                                             |
| ------------------------- | ----------------------------------------------- |
| `npm run dev`             | 開発サーバーと変更内容の自動反映                 |
| `npm run typecheck`       | 厳格な TypeScript チェック                       |
| `npm run build`           | 型チェック後に `dist/` 静的サイトを生成          |
| `npm run preview`         | ビルドしたサイトをローカルで確認                 |
| `npm run format`          | ソース・ドキュメントの整形                       |
| `npm run format:check`    | 整形チェック                                     |
| `npm test`                | ビルド結果を対象にした Playwright ブラウザテスト |
| `npm run storybook`       | コンポーネントカタログ開発サーバー（6006）       |
| `npm run storybook:build` | カタログの静的ビルド（`storybook-static/`）      |
| `npm run test:storybook`  | ビルドしたカタログのブラウザ検査                 |
| `npm run check`           | 整形・型・ビルド・ブラウザ検査                   |

テストの初回実行前に `npx playwright install chromium` を実行してください。Linux CI では `npx playwright install --with-deps chromium` を使用します。

## 構成

```text
src/
  app/          画面構成
  components/   共通タイトル、カード、ヘッダー・フッター、モーダルマークアップ
  design/       8px デザイントークン、共通レイアウト契約
  stories/      Storybook コンポーネント・状態・設定サンプル
  content/      作品データ、ナビゲーション、アーカイブフォールバック・検証
  features/     works, archives, hero, concept, members, scroll
  lib/          共通 DOM・Canvas・数学関数
  sections/     セクション別の静的コンテンツ
  styles/       Tailwind エントリーポイント、基本デザイン、タイポグラフィ
  main.ts       明示的な初期化順序
  types.ts      コンテンツ型
public/
  assets/       画像、アーカイブ JSON、出典資料
  design-concepts/ 実際の画面で使用するメンバー画像
  prototypes/   過去の個別デザイン案（保存用 HTML・JS・CSS）
  wireframe.html Figma 説明用の静的画面
scripts/        任意の Python 素材制作ツール

docs/           構成・実装・検証・引き継ぎガイド、デザイン案
tests/         ブラウザ回帰テスト
```

- [構成と依存関係](docs/architecture.md)
- [実装・コンテンツ修正ガイド](docs/implementation.md)
- [テスト・ビルド・デプロイガイド](docs/validation.md)
- [既存資料と公開前チェック事項](docs/handoff.md)

デフォルトの画面は既存の `preview.html` 統合版です。以前の `index.html` 個別アーカイブ案は `/prototypes/index.html`、作品・コンセプト案は `/prototypes/works.html`、`/prototypes/concept.html` で確認できます。

## 素材とコンテンツ

作品30点のうち実画像は2点で、残りは仮スロットです。会場A/Bの割り当てと紹介文も仮のものです。アーカイブ29件の出典・素材の権利については [アーカイブガイド](public/assets/archive/imported/README.md)、[コンセプトガイド](public/assets/concept/README.md)、[参考資料ガイド](public/assets/reference-layrid/README.md) を確認してください。既存資料の詳細な注意事項は [引き継ぎ文書](docs/handoff.md) に保存しています。
