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

### 5.2 Typography

方向性は `Japanese Swiss` に寄せる。

- 見出し: 軽めウェイトの sans-serif
- 本文: 可読性優先の sans-serif
- セクションラベル: 小サイズ、広め字間、英数字ベースの editorial トーン

タイプ階層の指針:

- Hero / page title: `30px - 38px`, weight `300`, tight letter spacing
- Section title: `20px - 24px`, weight `400-500`
- Card title: `17px - 18px`, weight `500`
- Body: `16px`, line height `1.55 - 1.7`
- Secondary text: `13px - 14px`, line height `1.5 - 1.65`
- Meta / label: `11px - 12px`, weight `500`, letter spacing `0.14em - 0.18em`

### 5.3 Shape and Effects

- Corner radius は原則小さくする。現行より明確にシャープに寄せる
- 主要サーフェスは `1px` 罫線を基本にする
- 影は使わないか、ごく弱いものに限定する
- ボタンは立体感ではなく、面のコントラストで見せる

### 5.4 Spacing

現行よりも余白を増やし、詰め込み感を下げる。

- セクション間: `24px - 32px`
- カード内: `16px - 20px`
- フォーム要素間: `10px - 14px`
- 画面左右パディング: mobile で `16px - 20px`, desktop で `24px - 32px`

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

### Key changes

- 手続きカードを `手続き名 / 表示理由 / 公式確認先 / 注意文` の順に整理する
- 危険ケースや期限性の高い項目だけ線の強さを上げる
- `公式確認先` はリンクとして見つけやすくするが、全体の静けさは壊さない
- チェックアウト導線は「大きな販売箱」ではなく、結果の延長にある整理された次アクションとして見せる

### 6.4 Purchase Success and Waiting States

### Purpose

- 購入後の安心感とダウンロード行動をつなぐ

### Key changes

- 成功状態は通知ではなく、静かな受け渡し画面にする
- ダウンロードアクションを主役にする
- 再送フォームは明確に従属領域へ落とす
- `決済確認中` や `テスト決済` も同一トーンに揃える

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

### Key changes

- 現行のカード感を減らし、印刷物らしい組版に寄せる
- 色による区別は最小化し、見出しサイズと罫線で整理する
- メモ欄は残すが、装飾化しない
- UI の CTA 的な見た目は PDF から排除する

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
- コントラストは黒白基調で十分に確保する
- 押下可能領域は 44px 以上を意識する
- hover に依存しない
- 状態差分は色だけでなく、線や文言でも示す

## 9. Testing and Validation

### Visual validation

- landing, diagnosis, results, purchase-success をローカルで目視確認する
- mobile / desktop の両方で hierarchy が崩れないことを確認する
- 無料結果から有料導線までの視線移動が自然かを見る

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

- ランディングページが現状より情報量を絞りつつ、信頼感を高めている
- 診断フォームが現状より読みやすく、入力しやすい
- 結果画面で期限別 hierarchy が一目で分かる
- 有料導線が露骨な販売箱に見えず、自然な次アクションに見える
- 購入完了画面が結果画面と連続したトーンで整っている
- PDF が印刷物として見栄えする
- 既存の主要テストが通る
