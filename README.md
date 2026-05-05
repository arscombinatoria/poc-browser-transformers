# Browser Transformers PoC

Vite + vanilla JavaScript + `@huggingface/transformers` を使った、ブラウザ内AI推論の最小PoCです。静的サイトとして GitHub Pages にデプロイできます。

## 概要

- サーバーサイドなし、APIキーなしでブラウザ上で推論を実行します。
- 1ページUIで以下タスクを切り替えできます。
  - Text Generation
  - Summarization
  - Sentiment Classification
- 初回実行時にモデルを Hugging Face Hub から取得し、同一タスクの pipeline はメモリキャッシュを再利用します。

## 使用技術

- Node.js
- Vite
- vanilla JavaScript
- HTML / CSS
- `@huggingface/transformers`
- GitHub Actions
- GitHub Pages

## ローカル実行方法

```bash
npm install
npm run dev
```

ブラウザで表示されたローカルURLを開いて動作確認してください。

本番ビルド確認:

```bash
npm run build
npm run preview
```

## GitHub Pagesへのデプロイ方法

1. このリポジトリの `main` ブランチへ push します。
2. `.github/workflows/deploy.yml` が起動してビルド・デプロイします。
3. GitHub の Pages 設定で Build and deployment の Source は **GitHub Actions** を選択します。

### `base` 設定について

`vite.config.js` は GitHub Pages のリポジトリ配下公開に合わせて、初期値を以下に設定しています。

- `base: '/browser-transformers-poc/'`

リポジトリ名を変更した場合は、この `base` を `/<新しいリポジトリ名>/` に変更してください。

## モデル取得とプライバシー

- モデル本体はアプリに同梱せず、実行時に Hugging Face Hub から取得します。
- 初回ロードはダウンロードが発生するため時間がかかります。
- サーバーサイドやAPIキーは不要です。
- 推論処理はブラウザ内で実行され、入力テキストを外部LLM APIへ送信しません。
- ただし、モデルファイル取得のため Hugging Face Hub への通信は発生します。

## 既知の制約

- ブラウザや端末性能によっては推論が遅くなる場合があります。
- 大きな入力テキストはメモリ不足やタイムアウトで失敗する場合があります。
- モデル品質はPoC用途であり、タスク品質の保証はありません。
- 初回ロード時はモデルダウンロードによりネットワーク通信量が大きくなる場合があります。
