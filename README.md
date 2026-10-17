# Browser Transformers PoC

![Coverage](coverage/badges.svg)

Vite・vanilla JavaScript・Transformers.jsで、ブラウザ内AI推論を試すPoCです。推論用サーバーやAPIキーなしで、テキスト生成・要約・感情分類を1画面で試せます。

[GitHub Pagesでデモを試す](https://arscombinatoria.github.io/poc-browser-transformers/)

## Features

- ブラウザ内でテキスト生成・要約・感情分類を実行できます。
- WebGPU / WASMと、モデルに応じた量子化・精度を選択できます。
- テキスト生成はストリーミング表示に対応します。モデルのチャットテンプレートを使い、毎回独立した質問として処理します。会話履歴は引き継がず、完了時は最後の回答本文を表示します。

## Supported Models

| タスク | モデル（Hugging Face） |
| --- | --- |
| テキスト生成 | [onnx-community/Qwen3.5-0.8B-Text-ONNX](https://huggingface.co/onnx-community/Qwen3.5-0.8B-Text-ONNX) |
| テキスト生成 | [HuggingFaceTB/SmolLM2-360M-Instruct](https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct) |
| テキスト生成 | [onnx-community/Ternary-Bonsai-1.7B-ONNX](https://huggingface.co/onnx-community/Ternary-Bonsai-1.7B-ONNX) |
| 要約 | [Xenova/distilbart-cnn-6-6](https://huggingface.co/Xenova/distilbart-cnn-6-6) |
| 感情分類 | [Xenova/distilbert-base-uncased-finetuned-sst-2-english](https://huggingface.co/Xenova/distilbert-base-uncased-finetuned-sst-2-english) |

選定理由と旧モデルとの比較は、[モデル選定の記録](docs/model-selection.md)を参照してください。

## Quick Start

Node.js 24（CIと同じバージョン）とnpmを用意し、リポジトリのルートで実行します。

ローカル開発では、開発サーバーを起動し、表示されたURLを開きます。

```bash
npm install
npm run dev
```

本番ビルドを確認する場合は、開発サーバーをCtrl+Cで停止してから実行します。

```bash
npm run build
npm run preview
```

画面でタスクと設定を選び、テキストを入力して「実行」を押します。「クリア」で入力・出力・ステータス・エラーをリセットできます。

開発時には、以下の検証コマンドも利用できます。

```bash
npm test                 # Vitest（ユニット/UIテスト）
npm run test:watch       # 監視モード
npm run coverage         # 計測とcoverage/badges.svgの更新
npm run test:e2e         # Playwright E2E
npm run test:e2e:headed  # ブラウザ表示付きE2E
```

## Configuration

- **実行バックエンド**: WebGPU（既定）/ WASMを選択します。自動切り替えは行わないため、WebGPUが利用できない場合はWASMを選んでください。
- **dtype（量子化・精度）**: Bonsaiは`q2`（既定）/ `q2f16`、その他は`q4`（既定）/ `q8` / `fp16` / `fp32`をUIで選択できます。モデル変更時に選択中のdtypeが対象外なら既定値へ戻ります。半精度演算を使う`fp16` / `q2f16`など、実行可否はモデルファイルとバックエンド・端末の対応状況にも依存します。
- **max_new_tokens**: テキスト生成で追加する最大トークン数です。既定は128、16〜1024を16刻みで選択できます。要約・感情分類には適用しません。

推論パイプラインは、タスク（モデル）・dtype・バックエンドの組み合わせごとにメモリ内で再利用します。「クリア」では破棄せず、ページを再読み込みするとリセットされます。

## Deployment

GitHub Pagesの **Settings > Pages > Build and deployment > Source** を **GitHub Actions** に設定します。`main`へのpush、または[デプロイワークフロー](.github/workflows/deploy.yml)の手動実行で、ビルドした`dist`を公開します。

[vite.config.js](vite.config.js)の`base`は`/poc-browser-transformers/`です。リポジトリ名を変更する場合は、公開サブパスに合わせて更新してください。

## Limitations & Privacy

- 初回実行時はHugging Face Hubからモデルをダウンロードするため、時間と通信量が必要です。
- 推論はブラウザ内で実行し、入力テキストを外部LLM APIへ送信しません。ただし、モデル取得のためHubへの通信は発生します。
- 速度は端末性能・ブラウザ・モデル・設定に左右されます。モデルや入力のサイズによってメモリ不足や処理失敗が起こる場合があり、すべての組み合わせでの動作は保証しません。
- 本プロジェクトはPoCです。本番用途での品質・速度・安定性は保証しません。
