# おくやみ手続きナビ UI Refresh Design

- Date: 2026-03-21
- Status: Draft for planning
- Working title: Okuyami Checklist UI Refresh

## 1. Summary

既存実装の機能は成立しているが、UI と PDF の見た目が平板で、信頼感と購入意欲を十分に支えられていない。
本リフレッシュでは、情報量や導線は大きく変えずに、視覚設計を全面的に見直す。

目指す方向は `minimal + refined` であり、具体的には `Japanese Swiss` に寄せた静かな緊張感を持つ体験にする。
黒白を基調にしつつ、行動導線と一部の注意要素にだけ `deep sage` を差し込む。
余白、タイポグラフィ、罫線、階層で信頼を作り、感情を煽らない上品さを優先する。

この refresh で変えてよいものと、変えないものを先に固定する。

- 変えてよい: 見た目、余白、見出し量、補助文の圧縮、カード構造、CTA の視覚的な強弱
- 変えない: ページ遷移、診断の質問セット、結果生成ロジック、checkout の基本導線、download / resend の機能
- IA の再配置は許容するが、LP → 診断 → 結果 → checkout → purchase-success → download の流れは維持する

## 2. Problem Statement

現行 UI には次の課題がある。

- 全画面で同じような箱と色が続き、情報の優先順位が弱い
- 和紙調の色味はやさしいが、既視感があり、洗練よりも「仮組み」に見えやすい
- 診断フォーム、結果画面、購入完了画面、PDF のトーンが完全には揃っていない
- 有料 PDF が「高く整った印刷物」ではなく、Web UI をそのまま PDF にした印象に寄っている
- 無料結果から購入への導線が、視覚的には十分に信頼感を積み上げられていない

本リフレッシュは、機能の追加よりも「見た瞬間に安心して進めること」と「有料版が整った成果物に見えること」を主目的にする。

## 3. Design Goal

### Primary goal

- サービス全体を、静かで洗練された一般案内プロダクトに見せる

### Secondary goals

- 無料結果画面から有料 PDF への遷移に、視覚的な納得感を持たせる
- 入力、閲覧、購入、ダウンロードまでを一貫したトーンでつなぐ
- PDF を「印刷して共有できる道具」として自然に感じられる見た目にする

### Non-goals

- 診断ロジックの変更
- ルーティングや決済フローの再設計
- コンテンツ本文の大幅な増量
- アニメーション主体のブランド演出
- 新しい機能領域の追加

## 4. Visual Direction

### Chosen direction

`A2: Monochrome + Deep Sage`

これは、黒白の静かな緊張感を基調にしつつ、CTA、フォーカス、限定的な強調だけに深い緑灰色を使う方向である。
完全モノクロよりも実用性があり、温かさを足しすぎずに信頼感と操作性を両立できる。

### Visual keywords

- quiet
- editorial
- japanese swiss
- refined
- monochrome
- restrained
- print-aware
- trustworthy

### Tone rules

- 感情を煽る派手な配色を使わない
- 角丸、影、グラデーションは最小化し、基本はフラットで構成する
- 装飾よりも `余白 + 文字の重み + 罫線` で階層を作る
- 成功や注意も「UI 通知」ではなく「落ち着いた状態表示」として見せる

## 5. Design System

### 5.1 Color

初期トークンは次を基準とする。

- `--bg`: `#F5F5F2`
- `--surface`: `#FFFFFF`
- `--surface-muted`: `#FAFAF7`
- `--text`: `#111111`
- `--text-muted`: `#666666`
- `--text-subtle`: `#8A8A8A`
- `--line`: `#DCDCD7`
- `--line-strong`: `#111111`
- `--accent`: `#5B665F`
- `--accent-strong`: `#445048`
- `--accent-soft`: `#EEF1EE`

state 用の semantic token は別途固定する。

- `--state-default-bg`: `--surface`
- `--state-default-line`: `--line`
- `--state-urgent-bg`: `--surface`
- `--state-urgent-line`: `--line-strong`
- `--state-warning-bg`: `--accent-soft`
- `--state-warning-line`: `--accent`
- `--state-success-bg`: `--accent-soft`
- `--state-success-line`: `--accent`
- `--state-pending-bg`: `--surface-muted`
- `--state-pending-line`: `--line`
- `--state-test-bg`: `--surface-muted`
- `--state-test-line`: `--line-strong`
- `--state-link`: `--accent-strong`

### 5.2 Typography

方向性は `Japanese Swiss` に寄せる。

- Web font stack: `"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif`
- PDF font stack: `src/services/pdf/assets/noto-sans-cjk-jp-subset.ts` の埋め込み `Noto Sans CJK JP subset` を使う
- 見出し: 軽めウェイトの sans-serif
- 本文: 可読性優先の sans-serif
- セクションラベル: 小サイズ、広め字間、英数字ベースの editorial トーン

weight 運用は次で固定する。

- Web: `300 / 400 / 500`
- PDF: 単一埋め込みフォント前提で `size / spacing / rule` によって階層を作る
- PDF では synthetic bold や別フォント追加を行わない

要素別の最小サイズは次で固定する。

- Hero title: mobile `32px`, desktop `38px`, weight `300`, letter spacing `-0.04em`
- Page title: mobile `30px`, desktop `34px`, weight `300`, letter spacing `-0.03em`
- Section title: mobile `22px`, desktop `24px`, weight `400`
- Card title: `18px`, weight `500`
- Body: `16px`, line height `1.6`
- Input text: `16px`
- Helper / secondary / disclaimer: `13px`, line height `1.55`
- Meta / label: `11px`, weight `500`, letter spacing `0.16em`
- Button label: `13px`, weight `500`, letter spacing `0.08em`
- PDF title: `22pt`
- PDF section title: `14pt`
- PDF block title: `11pt`
- PDF body: `10pt`
- PDF meta: `9pt`

breakpoint は次で固定する。

- mobile: `0 - 767px`
- tablet: `768 - 1023px`
- desktop: `1024px+`

### 5.3 Shape and Effects

- Corner radius は原則小さくする。現行より明確にシャープに寄せる
- 主要サーフェスは `1px` 罫線を基本にする
- 影は使わないか、ごく弱いものに限定する
- ボタンは立体感ではなく、面のコントラストで見せる

### 5.4 Spacing

現行よりも余白を増やし、詰め込み感を下げる。

token は次で固定する。

- `space-page-x-mobile`: `16px`
- `space-page-x-tablet`: `24px`
- `space-page-x-desktop`: `32px`
- `space-section-mobile`: `24px`
- `space-section-desktop`: `32px`
- `space-card-padding`: `18px`
- `space-card-gap`: `10px`
- `space-form-gap`: `12px`
- `space-stack-gap`: `16px`
- `space-meta-gap`: `8px`

breakpoint ごとの適用:

- Landing / Results / Purchase Success の左右パディング: mobile `16px`, tablet `24px`, desktop `32px`
- Diagnosis question card padding: mobile `16px`, desktop `18px`
- section gap: mobile `24px`, desktop `32px`
- PDF page margin: `40pt`

### 5.5 State Expression

状態差分は色だけでなく、線、ラベル、配置でも示す。

- `default`: 1px `--line`、追加ラベルなし
- `urgent`: 1px `--line-strong`、小ラベルで期限性を明示
- `warning`: `--state-warning-bg`、1px `--state-warning-line`、相談や注意ラベルを表示
- `success`: `--state-success-bg`、1px `--state-success-line`、完了文言を先頭に置く
- `pending`: `--state-pending-bg`、1px `--state-pending-line`、`確認中` ラベルを表示
- `test`: `--state-test-bg`、1px `--state-test-line`、`TEST MODE` ラベルを表示
- `link`: `--state-link`、下線または text-decoration でリンクだと即座に判別できるようにする

アイコンは必須ではない。色だけに依存しないことを優先し、必要であっても補助的に使う。

## 6. Screen Strategy

### 6.1 Landing Page

### Purpose

- サービスの価値を短時間で理解させる
- 無料診断開始へ迷いなく誘導する

### Layout

- 1 カラム中心
- 強い hero 見出し
- 補助説明は短く
- 追加情報は 2 枚前後の静かな補助カードに圧縮
- CTA は 1 つだけ主役にする

### Key changes

- 現状よりテキスト量を減らす
- note や disclaimer を箱で増やしすぎない
- Hero の情報密度を半段落くらいまで抑える
- 「一般案内であること」は薄い補助テキストかサブカードに逃がす

### Required trust copy

- Hero 近傍に `一般案内` であることを示す文言を 1 回は表示する
- 専門判断をしないことは LP 末尾または hero 直下の補助領域に必ず残す
- 文言の見た目は弱めてよいが、意味は削らない
- 配置は `hero 内または hero 直後` に限定し、LP 下部へ完全に追いやらない

### 6.2 Diagnosis Form

### Purpose

- 精神的に負荷が高い状況でも、迷わず入力を進められるようにする

### Layout

- `Q番号 / 質問 / 補足 / 入力` の順を固定
- 1問ごとのカードはフラットでシャープ
- 進捗はグラフィカルな meter よりも `14問中 3問目` のようなテキスト寄りの表現を優先

### Key changes

- ラジオ選択肢を「項目全体が押せる静かなリスト」にする
- fieldset ごとの差を余白と罫線で作る
- フォーム全体の注意文はページ末尾に 1 回だけ置く
- 入力欄は白地、細罫線、フォーカス時のみ accent を入れる

### Form state rules

- 全質問は required のまま維持する
- required は恒常的な赤アスタリスクではなく、質問設計と native required で扱う
- invalid state は border を `--line-strong` にし、入力の直下に短い補助文を表示できるようにする
- browser-native validation を使う場合でも、カスタムスタイルで focus が消えないようにする
- disabled state は `--surface-muted` と `--text-subtle` を使い、accent を消す
- キーボード操作の順序は現行と同じく視線順を維持する

### Error handling scope

- 既存のサーバー側 validation フローは壊さない
- UI refresh の範囲では、browser/native error と server-rendered error summary の両方が破綻しないことを優先する

### 6.3 Result Summary

### Purpose

- 今どこを見るべきかを一目で分かるようにする
- 有料版の価値を自然に理解させる

### Layout

- 画面冒頭で短い要約
- 一般案内の安全文言
- 期限別セクション
- エスカレーション注意
- 有料 PDF 導線

### Canonical section order

期限別セクションの並びは UI と PDF で固定する。

1. `まず 2 週間以内に確認したいこと`
2. `3 か月以内に要注意のこと`
3. `10 か月以内に確認すること`
4. `期限の確認が必要なこと`
5. `専門家相談を検討したいこと`

ルール:

- 空セクションは表示しない
- `期限不明` や canonical bucket に入らないものは `期限の確認が必要なこと` に入れる
- `専門家相談を検討したいこと` は最終セクションで固定する
- 1 つの手続きは 1 セクションにだけ属する
- 並び順は canonical order を優先し、セクション内は rule priority を使う

### Visual mapping

- `まず 2 週間以内に確認したいこと`: section heading の直下に強い黒の区切り線を置く
- `3 か月以内に要注意のこと`: default card を使い、期限が厳しい個別項目のみ urgent treatment を使う
- `10 か月以内に確認すること`: default card を使い、最も静かな密度で表示する
- `期限の確認が必要なこと`: warning treatment を使い、ラベルで `確認要` を出す
- `専門家相談を検討したいこと`: warning treatment を使い、ラベルで `専門家相談` を出す

card-level treatment:

- default card: white surface + 1px default line
- urgent card: white surface + 1px strong line + small uppercase label
- warning card: accent-soft surface + 1px accent line + warning label

### Key changes

- 手続きカードを `手続き名 / 表示理由 / 公式確認先 / 注意文` の順に整理する
- 危険ケースや期限性の高い項目だけ線の強さを上げる
- `公式確認先` はリンクとして見つけやすくするが、全体の静けさは壊さない
- チェックアウト導線は「大きな販売箱」ではなく、結果の延長にある整理された次アクションとして見せる

### Required trust copy

- 結果画面上部に `一般的な案内` であることを必ず表示する
- `公式確認先` で最新情報を確認することを必ず明記する
- 専門家相談が必要なケースでは、断定ではなく相談推奨として表現する

### 6.4 Purchase Success and Waiting States

### Purpose

- 購入後の安心感とダウンロード行動をつなぐ

### Key changes

- 成功状態は通知ではなく、静かな受け渡し画面にする
- ダウンロードアクションを主役にする
- 再送フォームは明確に従属領域へ落とす
- `決済確認中` や `テスト決済` も同一トーンに揃える

### State mapping

- success: `--state-success-bg` + `--state-success-line`
- pending: `--state-pending-bg` + `確認中` ラベル
- test: `--state-test-bg` + `TEST MODE` ラベル

色に加えて、見出し文言と小ラベルで状態を明確化する。

### State behavior

- success: primary CTA は `有料版のダウンロード`、secondary は `ダウンロードリンクを再送する`
- pending: primary CTA は持たず、再読み込みまたは待機案内を主メッセージにする
- test: primary CTA は `テスト決済を完了する`
- invalid / not-found: refresh 対象外とし、既存の plain error response を維持してよい

### 6.5 Paid PDF

### Purpose

- Web の延長ではなく、共有可能な整ったチェックシートにする

### Structure

- タイトル
- 作成日
- 期限別セクション
- 各手続きの簡潔な要点
- 書き込み欄
- 免責と更新情報

### Physical spec

- 用紙サイズ: A4
- 向き: 縦
- 余白: 四辺 40pt 前後
- ヘッダ: 1 ページ目のみタイトルと作成日を表示
- フッタ: なし
- ページ番号: なし

### Pagination rules

- セクション見出しだけがページ末尾に残らないようにする
- 手続きブロックは原則としてブロック単位で改ページする
- 長い日本語文字列は折り返して表示し、切り捨てない
- 1 ブロックが 1 ページに収まらない場合は、同一ブロックを次ページへ継続し、途中で切れても文脈が読めるように見出しを再表示する
- セクション順は Result Summary と同一に保つ

### Key changes

- 現行のカード感を減らし、印刷物らしい組版に寄せる
- 色による区別は最小化し、見出しサイズと罫線で整理する
- メモ欄は残すが、装飾化しない
- UI の CTA 的な見た目は PDF から排除する

### Required document copy

- PDF には `一般案内` であることを必ず明記する
- 公式情報が優先されることを必ず明記する
- 更新情報または作成日を必ず載せる
- これらは 1 ページ目に表示する

### 6.6 Required Legal and Trust Copy

次の意味要件は UI refresh でも削除しない。

#### Mandatory meaning blocks

1. 一般案内であり、個別の法的・税務・相続判断を提供しない
2. 実際に進める前に公式確認先または公式窓口を確認する
3. 複雑ケースでは専門家相談を検討する
4. PDF には作成日または更新情報を含める

#### Required placement

- LP: hero 内または hero 直後
- Diagnosis: submit ボタンの直前または直後
- Results: 最初の期限セクションの前
- PDF: 1 ページ目の title block 内またはその直後

#### Change policy

- 文言の行分け、配置順、見出し化は変更してよい
- 意味の短縮、削除、弱体化はしない
- UI 上で短く見せる場合でも、同ページ内のどこかに意味要件が残っていることを必須とする

## 7. Component-Level Change Plan

### 7.1 `src/ui/layout.tsx`

- 全体トークンの差し替え
- 背景、文字、リンク、罫線、入力、ボタンの基準を再定義
- 共通 spacing rhythm を作る

### 7.2 `src/ui/components/hero.tsx`

- コピー量を削減
- 強い見出し + 短い補助文 + CTA + 補助カードへ整理
- 注記の見せ方を静かな補助情報へ変更

### 7.3 `src/ui/components/diagnosis-form.tsx`

- 質問カードの余白と境界を再設計
- progress 表現を簡素化
- radio list / text input / date input を新トーンに合わせる

### 7.4 `src/ui/components/result-summary.tsx`

- 全体の hierarchy を再構成
- 期限セクションの見出し強化
- procedure card の情報順序調整
- checkout box の格上げではなく、自然な次アクション化

### 7.5 `src/server/routes/purchase-success.tsx`

- 成功 / 待機 / テスト決済 UI の再設計
- ダウンロード領域を主役にし、再送フォームをセカンダリにする

### 7.6 `src/services/pdf/checklist-pdf.ts`

- カード中心レイアウトから、印刷物中心レイアウトへ修正
- タイトル、セクション見出し、罫線、メモ欄の比率見直し
- PDF 全体の静かなトーンを UI と揃える

### 7.7 `src/services/pdf/checklist-pdf-model.ts`

- 必要なら PDF の見出し構造に合わせて文言や表示順を見直す
- UI の結果画面と PDF の並び順の一貫性を保つ

## 8. Interaction and Accessibility Rules

- すべての主要操作は visible focus を持つ
- 本文の主要テキストと入力文字は mobile でも 16px を下回らない
- 通常テキストは WCAG AA `4.5:1` 以上を満たす
- 大きい見出しは `3:1` 以上を満たす
- 押下可能領域は 44px 以上を意識する
- hover に依存しない
- 状態差分は色だけでなく、線や文言でも示す
- helper / label / disclaimer は 13px 以上を維持する
- link は色だけでなく下線でも判別可能にする
- invalid state では入力位置の近くにエラー文を出せるようにする
- focus ring は 2px 以上で、background と明確に分離する
- keyboard-only で `LP CTA → diagnosis fields → results links → checkout form → purchase actions` が到達できる

## 9. Testing and Validation

### Visual validation

- landing, diagnosis, results, purchase-success をローカルで目視確認する
- mobile / desktop の両方で hierarchy が崩れないことを確認する
- 無料結果から有料導線までの視線移動が自然かを見る
- landing / diagnosis / results / purchase-success は before/after screenshot を取得して比較する
- generated PDF は first page と longest-content sample page の screenshot または実ファイル比較を行う

### Functional validation

- 既存の route tests を維持する
- `npm run test`
- `npm run typecheck`
- `npm run test:e2e -- tests/e2e/diagnosis-purchase.spec.ts`

### PDF validation

- 既存 PDF テストを維持する
- 日本語表示、改行、罫線、メモ欄が崩れないことを確認する
- ダウンロードした実 PDF を目視で確認する

## 10. Implementation Constraints

- 機能変更ではなく UI refresh を中心にする
- コンテンツ本文の意味はできるだけ変えない
- 既存のテストが保証している振る舞いを壊さない
- CSS フレームワーク導入や大規模依存追加はしない
- Hono JSX ベースの既存構成を維持する

## 11. Open Questions Resolved in This Design

- 方向性は `A2` に確定する
- トーンは `minimal but not cold` にする
- PDF は UI のコピーではなく `print-aware checklist` に寄せる
- 結果画面が最優先の redesign 対象である

## 12. Acceptance Criteria

### Landing Page

- primary CTA は 1 つだけ視覚的に優位である
- hero の本文は補助段落 1 つに収まる
- `一般案内` であることが初回画面内で確認できる

### Diagnosis Form

- 各質問で `Q番号 / 質問 / 補足 / 入力` の順が維持される
- 進捗は meter 依存ではなくテキストで常時判別できる
- 入力文字サイズは mobile でも 16px 以上である
- invalid / disabled / focus state が視覚的に区別できる

### Result Summary

- canonical section order が UI で維持される
- 各手続きカードは `手続き名 / 表示理由 / 公式確認先 / 注意文` の順で読める
- `一般的な案内` と `公式確認先の確認` が画面上部で確認できる
- checkout 導線は結果カード群の直後に自然に接続される
- `期限の確認が必要なこと` と `専門家相談を検討したいこと` は warning treatment で判別できる

### Purchase Success

- download action が resend form より明確に優位である
- `success / pending / test` がラベルと文言で判別できる
- 結果画面から視覚トーンが断絶しない
- pending state では primary CTA を置かず、待機メッセージが主役になる

### Paid PDF

- A4 縦で出力される
- canonical section order が PDF でも維持される
- 長文サンプルでも折り返しと改ページが崩れない
- document-level の一般案内文言と作成日が確認できる

### Verification

- `npm run test`
- `npm run typecheck`
- `npm run test:e2e -- tests/e2e/diagnosis-purchase.spec.ts`
- 主要画面の目視確認と、生成 PDF の実ファイル確認を行う
- PR またはレビュー時に landing / diagnosis / results / purchase-success / PDF の承認用スクリーンショットを揃える
