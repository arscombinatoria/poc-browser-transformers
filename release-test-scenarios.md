# 初回リリース向けシナリオ仕様（Given / When / Then）

## 0. 根拠サマリ（既存仕様・README・テストからの抽出）

### ユーザー価値が高い操作（優先度順）
1. **主要変換フローを実行し、結果が表示されること**  
   - 1画面で Generation / Summarization / Classification を試せることが README の主機能。  
   - 実装も `runInference` を中心に構成。  
2. **起動直後に最小操作で使い始められること**  
   - 初期タスク設定、プレースホルダ、イベント接続は onboarding に直結。  
3. **失敗時に原因が分かるエラー表示が出ること**  
   - 空入力や pipeline 失敗時のエラー表示が UX 上必須。  
4. **繰り返し実行が遅くならないこと（キャッシュ）**  
   - 同一タスク再実行時の pipeline キャッシュ利用は体感性能に直結。  

### カテゴリ分類（優先度順）

#### A. 正常系（必須フロー）
- A-1: 初期化（taskSelect 初期値、placeholder、イベント接続）
- A-2: 実行ボタンで推論し結果表示（Generation）
- A-3: タスク変更 / Clear による表示リセット

#### B. 異常系（入力不正・通信失敗など）
- B-1: 空入力時に推論せずバリデーションエラーを表示
- B-2: モデルロード/推論失敗時に Error 状態とメッセージ表示

#### C. 回帰リスク高（壊れやすい箇所）
- C-1: 同一タスク再実行時に pipeline キャッシュが効く
- C-2: タスク別フォーマット分岐（generation / summarization / classification）

---

## 1. 初回リリース対象（3〜5本）

以下 5 本を初回リリースの受け入れシナリオに採用：

1. **起動確認（初期化）**
2. **主要変換フロー（Generation 実行成功）**
3. **入力不正（空入力）エラー表示**
4. **通信/モデルロード失敗時のエラー表示**
5. **回帰防止（同一タスク pipeline キャッシュ）**

---

## 2. Given / When / Then 1ページ仕様（テスト対応付き）

### S1. 起動確認（初期化）
- **テスト名対応**: `main.js initApp (UI integration) > 初期化時にDOM要素へイベントを接続し初期状態を設定する`
- **Given**
  - アプリを初期化可能な DOM 要素（`taskSelect`, `inputText`, `runButton`, `clearButton` ほか）が存在する。
- **When**
  - `initApp(document)` を実行する。
- **Then**
  - `taskSelect` に 3 タスク由来の選択肢（表示上 6 要素）が追加される。
  - 初期タスクが `generation` になる。
  - `inputText.placeholder` が `Once upon a time` になる。
  - `runButton.click` / `clearButton.click` / `taskSelect.change` のイベントが接続される。

### S2. 主要変換フロー（Generation 実行成功）
- **テスト名対応**: `main.js initApp (UI integration) > イベントフロー: clickで推論実行、change/clearで表示をリセットする`（前半）
- **Given**
  - 初期タスクが `generation`。
  - `pipeline('text-generation', 'Xenova/distilgpt2')` が利用可能で、推論結果 `[{ generated_text: 'ok' }]` を返す。
  - 入力欄に `hello` が入っている。
- **When**
  - Run ボタンをクリックする。
- **Then**
  - 指定モデルで pipeline が 1 回呼ばれる。
  - 推論関数が入力 `hello` で実行される。
  - 出力欄に `ok` が表示される。
  - ステータスは `Done` になる。

### S3. 入力不正（空入力）エラー表示
- **テスト名対応**: `main.js initApp (UI integration) > 入力が空の場合は推論せずエラーを表示する`
- **Given**
  - 入力欄が空白のみ（例: `'    '`）。
- **When**
  - Run ボタンをクリックする。
- **Then**
  - pipeline は呼ばれない。
  - エラー欄に `入力テキストを入力してください。` が表示される。

### S4. 通信/モデルロード失敗時のエラー表示
- **テスト名対応**: `main.js initApp (UI integration) > pipelineが失敗した場合はエラー状態になりボタンを再有効化する`
- **Given**
  - pipeline の初期化または推論が失敗し、`Error('load failed')` が投げられる。
  - 入力欄に有効な文字列が入っている。
- **When**
  - Run ボタンをクリックする。
- **Then**
  - ステータスは `Error` になる。
  - エラー欄に `load failed` を含む文言が表示される。
  - Run ボタンが再び有効化される（リトライ可能状態）。

### S5. 回帰防止（同一タスク pipeline キャッシュ）
- **テスト名対応**: `main.js initApp (UI integration) > 同一タスク2回目の実行でpipelineキャッシュを利用する`
- **Given**
  - 同一タスク（generation）で 2 回連続実行する。
  - pipeline は同一インスタンスを再利用可能。
- **When**
  - 1回目と2回目の Run を連続で実行する。
- **Then**
  - `pipeline(...)` の初期化呼び出しは 1 回のみ。
  - 推論関数自体は 2 回呼ばれる。
  - 2 回目終了後もステータスは `Done`。

---

## 3. 補足（既存仕様との差分）
- 本ドキュメントは**既存実装・既存テストの整理**であり、挙動変更は含まない。
- 「taskSelect options が 6 件」は現行テストの期待値に準拠（UI仕様としては将来確認余地あり）。
