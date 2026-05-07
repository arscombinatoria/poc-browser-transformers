# Browser Transformers PoC

![Coverage](coverage/badges.svg)

Vite + vanilla JavaScript + `@huggingface/transformers` を使った、**ブラウザ内AI推論**の最小PoCです。サーバーサイドやAPIキーなしで、テキスト生成・要約・感情分類を 1 画面で試せます。

## 主な機能

- ブラウザのみで推論を実行（サーバーサイド不要）
- 以下タスクをUIから切り替え可能
  - Text Generation（`onnx-community/Qwen2.5-0.5B-Instruct`）
  - Text Generation（`HuggingFaceTB/SmolLM2-360M-Instruct`）
  - Text Generation（`onnx-community/Bonsai-1.7B-ONNX`）
  - Summarization（`Xenova/distilbart-cnn-6-6`）
  - Sentiment Classification（`Xenova/distilbert-base-uncased-finetuned-sst-2-english`）
- 初回実行時に Hugging Face Hub からモデルを取得
- 同一タスクの pipeline はメモリキャッシュを再利用
- `Clear` ボタンで入力・出力・ステータスを初期化

## 技術スタック

- Node.js
- Vite
- Vanilla JavaScript
- HTML / CSS
- `@huggingface/transformers`
- Vitest（ユニット/UIテスト）
- Playwright（E2Eテスト）
- GitHub Actions / GitHub Pages

## セットアップ

### 前提

- Node.js 22 以上
- npm

### インストール

```bash
npm install
```

### 開発サーバー起動

```bash
npm run dev
```

表示されたローカルURLをブラウザで開いて確認してください。

## 使い方

1. タスクを選択（プルダウン）
2. 入力テキストを記入
3. `Run Inference` をクリック
4. 結果・ステータス・エラーメッセージを確認

> 補足: 実装では推論時に `device: 'webgpu'` を指定しています。ブラウザや環境によっては WebGPU 未対応・不安定な場合があります。

## 利用可能な npm scripts

```bash
npm run dev              # 開発サーバー
npm run build            # 本番ビルド
npm run preview          # 本番ビルドのローカル確認
npm run test             # Vitest 実行
npm run test:watch       # Vitest 監視
npm run coverage         # カバレッジ計測 + バッジ生成（coverage/badges.svg更新）
npm run test:e2e         # Playwright E2E 実行
npm run test:e2e:headed  # Playwright E2E（ブラウザ表示あり）
```

## デプロイ（GitHub Pages）

1. `main` ブランチへ push
2. `.github/workflows/deploy.yml` でビルド＆デプロイ
3. GitHub Pages の **Build and deployment > Source** を **GitHub Actions** に設定

### `vite.config.js` の `base` 設定

このリポジトリは GitHub Pages のサブパス公開を想定しています。

- 現在値: `base: '/poc-browser-transformers/'`

リポジトリ名を変更した場合は、`/<新しいリポジトリ名>/` に更新してください。

## モデル取得とプライバシー

- モデルはアプリに同梱せず、実行時に Hugging Face Hub から取得
- 推論処理はブラウザ内で完結し、入力テキストを外部LLM APIへ送信しない
- ただしモデルダウンロードのため、Hugging Face Hub への通信は発生

## 既知の制約

- 端末性能やブラウザ実装差により推論速度が大きく変わる
- 初回ロード時はモデル取得に時間と通信量が必要
- 入力サイズが大きい場合、メモリ不足やタイムアウトが発生する可能性あり
- モデル品質はPoC用途（本番品質は未保証）
