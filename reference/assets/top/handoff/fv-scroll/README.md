# FV / Scroll transition handoff

東京大学制作展2026のFVと、FVからCONCEPTへスクロールする際のロゴ粒子化だけを切り出した、依存ライブラリなしの実装です。

## 確認方法

Canvasが画像ピクセルを読むため、`file://` ではなくHTTPサーバー経由で確認してください。

```sh
cd handoff/fv-scroll
python3 -m http.server 8080
```

ブラウザで `http://localhost:8080/` を開きます。

## 収録範囲

- 1440 × 808を基準にしたFVの等比スケーリング
- `#e3e3e3` から `#ffffff` の背景グラデーション
- 赤い四角／青い円の背景粒子モーション
- カーソル付近でランダムな斑点状に浮き出る粒子反応
- 緑の筆ロゴと静止時の弱い屈折揺れ
- スクロール時の高密度な緑粒子への分解と移動
- 日本語タイトル、会場、日付、ワードマーク、来場予約チケット
- 左にグリーンドットを付けたFVナビゲーション
- `prefers-reduced-motion` 対応

## ファイル

- `index.html` — 必要最小限のDOMと読み込み順
- `fv-scroll.css` — FV、レイヤー、固定アートボード、スクロール区間
- `hero-fragments.js` — 緑ロゴの揺れ、スクロール進捗、粒子化
- `fv-flow-particles.js` — 背景の赤青粒子、カーソル反応、ロゴ部分のマスク
- `assets/` — この範囲で使う画像とSVGのみ

## 組み込み時の必須条件

1. `index.html` 内の `.top-header`、`#top.hero`、`#concept` の順序とクラス名を維持します。
2. スクリプトはDOMの後で、必ず `hero-fragments.js` → `fv-flow-particles.js` の順に読み込みます。
3. `#concept` は接続基準です。中身は本番のCONCEPTセクションへ置換できますが、IDと、最初の本文を含む `.story-copy p` は維持してください。
4. `.hero-art` 内の `.hero-brush` と `.hero-logo` は同じ画像を参照します。後者も削除しないでください。
5. Canvasが画像を読み取れるよう、ロゴ画像は同一オリジンで配信してください。
6. ナビゲーションの `href` は本番の各セクションIDに合わせて変更してください。

## レイヤー順

```text
背景グラデーション
  ↓
赤青の背景粒子（z-index: 1）
  ↓
緑ロゴ／スクロール粒子（z-index: 2）
  ↓
タイトル・会場・日付・チケット（z-index: 4）
  ↓
ナビゲーション（z-index: 12）
```

赤青粒子はロゴ形状でマスクされるため、緑ロゴの内部には透けません。

## 主な調整箇所

### FVの比率と余白

`fv-scroll.css` 冒頭の3変数が1440 × 808の固定アートボードを作ります。

```css
--fv-unit:min(.069444444vw,.123762376svh);
--fv-x:calc((100vw - 1440 * var(--fv-unit))/2);
--fv-y:calc((100svh - 808 * var(--fv-unit))/2);
```

### スクロール区間

`.birth-intro { height: 200svh; }` がFVを固定したまま変化させる距離です。

### 緑粒子の密度

`hero-fragments.js` の画像サンプリングは2px刻みです。数値を大きくすると軽く・疎に、小さくすると重く・密になります。

### 赤青粒子のカーソル反応

`fv-flow-particles.js` の `scatterPointerLobes()` が斑点の数、広がり、更新のランダム性を管理します。円形グローに見えないよう、異なる縦横比の11個の斑点を合成しています。

## 動作要件

- モダンブラウザ（Chrome / Edge / Safari / Firefoxの現行版）
- JavaScript有効
- 同一オリジンの画像配信

外部パッケージ、ビルド、WebGLは不要です。
