# モデル選定の記録

このドキュメントは、モデル選定時の判断と比較を保存するものです。現在の対応モデルとUIで選択できる設定は、[README](../README.md)を参照してください。

## 生成モデルの更新（2026-10-01）

以下は2026-10-01時点の更新記録です。容量やライブラリの互換性に関する説明も、その時点の情報として残しています。

| 系列 | 採用モデル | 選定理由・旧モデルとの比較 |
| --- | --- | --- |
| Qwen | [Qwen3.5-0.8B-Text-ONNX](https://huggingface.co/onnx-community/Qwen3.5-0.8B-Text-ONNX) | Qwen3-0.6Bから更新しました。画像用の重みを含まないテキスト専用版を採用しました。 |
| SmolLM | [SmolLM2-360M-Instruct](https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct) | 維持しました。[後継のSmolLM3](https://huggingface.co/HuggingFaceTB/SmolLM3-3B-ONNX)は3Bで、360Mの約8.3倍のパラメータ数になるためです。 |
| Bonsai | [Ternary-Bonsai-1.7B-ONNX](https://huggingface.co/onnx-community/Ternary-Bonsai-1.7B-ONNX) | 同規模の新しいternary版へ更新しました。公開済みのq2 / q2f16を選択可能とし、既定はq2にしました。 |

Hub上のONNXグラフと外部重みファイルの合計容量は、次のように変わりました。

- Qwenのq4は、約919 MBから約551 MBへ減少しました。
- Bonsaiの既定設定は、従来のq4（約1,119 MB）からq2（約506 MB）へ変更しました。

容量は10進表記で、トークナイザーなどを含みません。ダウンロード容量の比較であり、実行時メモリ使用量や速度を保証するものではありません。

更新時に使用していたTransformers.js 4.3系は、更新先のモデル型とq2形式に対応していました。Bonsaiから他モデルへ切り替えた際は、非対応のq2設定をq4へ戻す扱いにしました。q2f16には半精度演算への対応が必要です。ライブラリ側の対応だけでは、各端末のWebGPU / WASMでの動作・速度・品質を保証できないため、実環境での確認が必要です。
