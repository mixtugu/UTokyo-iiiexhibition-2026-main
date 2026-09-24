# iii Exhibition 2026 — Web prototype

東京大学制作展のデザイン・インタラクション確認用プロトタイプです。
正式な公開サイトではなく、作品情報・会場分類・掲載文章・画像に仮の内容を含みます。

## 起動方法

ビルドや npm install は不要です。Python 3 がある環境で、このフォルダから実行します。

```sh
python3 -m http.server 4323
```

ブラウザで http://localhost:4323/preview.html を開いてください。
画像やJSONを読み込むため、HTMLファイルのダブルクリックではなくHTTPサーバーを使用します。

## 現行版とファイル構成

- `preview.html`: 現行の統合プロトタイプ。TOPからフッターまで。
- `preview.css`, `atmosphere.css`: 基本レイアウト・見た目。
- `hero-particles.js`: TOPのロゴ粒子、CONCEPTへの接続。
- `concept-story.js`, `concept-story.css`, `concept-liquid.js`: CONCEPTの固定背景、切り替え、粒子化。
- `works-wave.js`, `works-wave.css`: 作品30枠、ロゴ状配置、会場A/B、検索・一覧・ホバー。
- `preview.js`: 作品詳細モーダル・アーカイブ一覧。
- `member-transition.js`: 元のメンバー画像からアーカイブ輪郭への粒子変形。
- `smooth-scroll.js`: スクロールの調整。
- `assets/`: ロゴ・作品・地図・過去展示の画像。
- `design-concepts/members-original-transparent.png`: 元のメンバー名グラフィック。
- `wireframe.html`: Figma取り込み用の静的な説明画面。実際の動作の基準は `preview.html`。
- `index.html`, `works.html`, `concept.html` と関連ファイル: 過去の個別試作。統合版とは異なります。
- `scripts/`: 素材作成・収集に使用した補助スクリプト。通常の閲覧には不要。一部は当時の一時ファイルに依存します。

## 引き継ぎ時の確認事項

- 作品は30枠。実画像2点、残り28点は仮枠です。会場A/Bの割り振りも仮です。
- アーカイブは公式サイトを参照した29件。画像・ロゴ等の権利は各権利者に帰属します。
- 開催日時、会場、Donationの文章・リンク、正式な作品情報は関係者に確認してください。
- ACCESSの地図は資料画像の切り抜き表示です。正式な地図への差し替えが必要です。
- 問い合わせメールは原資料の表記を保持しており、現状 `@` がありません。公開用に要確認です。
- CONCEPTの外部参考写真5枚は公開許可未確認のためGit対象外です。現在は過去制作展のアーカイブ画像5枚を仮配置しています。出典・仮素材の説明は `assets/concept/README.md`。正式採用時は背景への転用許可を確認してください。
- Figmaの説明画面は動作・権限・レスポンシブを完全再現したものではありません。
- 実装時はモバイル、キーボード操作、動きを抑える設定、描画負荷を確認してください。

## 素材の扱い

本リポジトリに第三者素材を再利用可能とするライセンスは付与していません。
参考写真の出典は `assets/reference-layrid/README.md`、アーカイブは `assets/archive/imported/README.md` を参照してください。
画像の再配布・本番公開については、各素材の権利・許可を確認してください。

## Figma

https://www.figma.com/design/zb65ebDCEavshYKyUQ7t82

## ZIPと版の一致

共有用サイト: https://anninumai.github.io/iii-exhibition-2026/

GitHub: https://github.com/anninumai/iii-exhibition-2026

mainへのプッシュでGitHub Pagesを更新します。公開時のみpreview.htmlをトップのindex.htmlとして配置します。既存のポートフォリオとは別のプロジェクトです。

プッシュしたコミットから `git archive` でZIPを作成すると、エンジニアへの引き継ぎ版とGitHub上のソースを一致させられます。
GitHubの「Code → Download ZIP」でも取得できます（ブランチのZIPは更新に伴い中身が変わります）。
