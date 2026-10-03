# AGENTS.md

このリポジトリを編集するエージェント向けの指針。Windows デスクトップ用の AutoHotkey v2 スクリプトを対象とし、編集・起動・停止・検証の判断に必要な情報をまとめる。

## 言語とリファレンス

- 対象は AutoHotkey `>=2.0 <3.0`。使用中の正確な版・32/64bit は実行前に確認し、v1 の構文や API を混ぜない。
- AHK の処理を変更するときは、変更対象の構文・関数・ディレクティブについて [v2 公式リファレンス](https://www.autohotkey.com/docs/v2/)を読む。引数、戻り値、コールバックの契約、適用される版の制約を確認する。構文の入口は [Language](https://www.autohotkey.com/docs/v2/Language.htm)。全文を毎回読む必要はない。
- 公式ページを取得できない場合はその旨を報告する。仕様上の不確実性が変更の正しさに影響する場合は、手元の v2 ヘルプなどで確認するか、確認できるまでその変更を止める。記憶や既存コードだけを仕様の根拠にしない。

## 変更対象の探し方

以下のパスはリポジトリルート基準。全ファイルを毎回読むのではなく、入口と変更対象の呼び出し元・依存先を確認する。

| 対象 | 最初に読む場所 |
| --- | --- |
| Main の起動・初期化・include 順 | Main/Main.ahk |
| アプリ別のキー操作 | Main/HotKeys/LocalHotkey.ahk |
| 共通のキー操作・hotstring | Main/HotKeys/GlobalHotkey.ahk |
| マウス操作 | Main/HotKeys/MouseHotkey.ahk |
| ゲーム判定・ウィンドウ操作などの共通処理 | Main/Modules/Utils.ahk |
| クリップボード履歴 | Main/Modules/ClipboardHistory.ahk |
| IME・カーソル制御 | Main/Modules/AutoHankaku.ahk、Main/Modules/MonitorCursorGuard.ahk |
| フックと配列拡張 | Main/Modules/WinHook.ahk、Main/Modules/ArrayExtension.ahk |
| トレイ・クリック補助 | Main/Modules/MenuTray.ahk、Main/Modules/HotClick.ahk |
| 独立した画面オフ用スクリプト | ScreenLock/ScreenLock.ahk |
| 個人設定の契約 | Env.ahk.example |

## 編集時の境界

- Main の Local → Global → Mouse の include 順にはホットキーの優先関係に関わる意図がある。変更時は [#Include](https://www.autohotkey.com/docs/v2/lib/_Include.htm) と [#HotIf](https://www.autohotkey.com/docs/v2/lib/_HotIf.htm) の仕様と重複するキー定義を確認する。Local / Global 末尾の `#HotIf` による条件解除と、後続 Mouse の適用範囲も確認する。
- GlobalHotkey の RDP 除外は全機能の停止を意味しない。アプリ条件やゲーム判定を変える場合は、LocalHotkey、GlobalHotkey、Utils の関連条件と影響範囲を確認する。
- `~`、`*`、左右修飾キー、down/up、`KeyWait`、`#InputLevel`、`Send` 系の選択は動作の一部として扱う。整理・整形に混ぜて変更しない。
- フック変更では登録・解除、コールバックの寿命、`OnExit` を確認する。AutoHankaku の ShellHook 採用理由は同ファイルのコメントを読む。Main でコメントアウトされている `SetupHotClick()` は、機能を有効化する依頼なしに有効化しない。
- ウィンドウタイトルは Main で RegEx モードに設定される。正規表現、日本語、en/em dash、IME 用仮想キーを見た目の類似だけで置換しない。新しいコード・コメントは英語で書き、既存の照合対象や送信文字列は動作上必要な値を維持する。
- 相対 include と Main/Assets/AHK.ico の参照を保つ。Main はルートの Env.ahk の `EMAIL` を利用する。Env.ahk は Git 管理外で新しい checkout に引き継がれないため、必要なら所有者に Env.ahk.example に沿った準備を依頼する。ScreenLock はこの設定を参照しない。
- 個人設定は必要性と許可を確認せず読み取り・上書き・別 checkout へのコピーをしない。設定項目の追加時は Env.ahk.example にダミー値で契約を反映し、個人値を文書やコミットへ含めない。
- 保存形式は対象ファイルに合わせる。現状の追跡テキストは LF、Main/Main.ahk は UTF-8 BOM 付き。一括した BOM・改行変換は行わない。AHK++ の既存整形設定は .vscode/settings.json にある。

## 実行前の確認

Main/Main.ahk と ScreenLock/ScreenLock.ahk は独立した入口であり、Main は ScreenLock を起動しない。通常起動・Reload は構文チェックではなく、次の作用を伴う。

| 入口 | 主な作用 |
| --- | --- |
| Main | 入力フック、優先度 Realtime、NumLock AlwaysOn、CapsLock・ScrollLock AlwaysOff、クリップボード監視、ウィンドウ切替時の IME 操作・モニター内カーソル制限 |
| ScreenLock | 起動直後と1秒間隔の画面オフ処理。トレイアイコンなし。Windows セッションのロックではない |

実行前に次を確認する。

- 対象 checkout と Windows 側のスクリプトパス、使用する v2 実行ファイル・版・32/64bit、管理者権限・UIAccess の要否。これらはリポジトリでは確定していない。`.ahk` の関連付けだけで v2 と判断しない。
- 変更に関係するキーボード配列・IME、アプリ、RDP、モニター配置・DPI、マウスの追加ボタンと期待する操作結果。
- 停止手段と対象プロセスの識別方法。両入口の `#SingleInstance Force` により既存インスタンスが置き換わる可能性も考慮し、起動・確認操作・副作用について所有者の承認を得る。

Main/HotKeys/LocalHotkey.ahk のウィンドウ条件に合う VS Code / Zed では、`Ctrl+S` 後に実行中 Main が Reload される。ファイル種別や checkout を判別しないため、文書や別 worktree の保存操作でも常用中の Main に影響し得る。

## 停止手段

以下は現行コード上の操作であり、実機での成功を保証しない。複数スクリプトの同一キー登録や RDP 中の制約を考慮し、ホットキーが効かなくても対象プロセスを識別して終了できる手段を起動前に準備する。

| 対象 | 操作と制約 |
| --- | --- |
| Main | トレイの Exit または `Ctrl+Shift+Delete` で終了。後者は GlobalHotkey の RDP 除外条件下にある。`Alt+P` の Pause / `Alt+Delete` の Suspend を終了・全フック解除の代わりにしない |
| ScreenLock | `Ctrl+Shift+Delete` で終了。右 Alt + 右 Shift を処理で検出されるまで保持すると画面オフのタイマーだけ停止し、プロセスは残る |

根拠は Main/HotKeys/GlobalHotkey.ahk、Main/Modules/MenuTray.ahk、ScreenLock/ScreenLock.ahk。終了後もキー状態・カーソル制限などがすべて元に戻るとは仮定せず、確認する。

## 検証と報告

- まず差分、参照先、`#HotIf` の範囲、重複キー、コールバックの登録・解除、保存形式を変更範囲に応じて静的確認する。仕様の照合は「言語とリファレンス」に従う。
- CLI formatter・linter・型検査・自動テストの標準コマンドは未設定。利用可能な AHK++ の診断は実行結果と分けて記録する。静的確認だけで起動可能性や実機動作を保証しない。
- 実機確認では、対象ウィンドウ・入力・期待結果と、対象外で変化してはいけない操作を決める。「実行前の確認」を終えて承認された操作だけを行い、結果と終了後の状態を記録する。
- Windows 実行環境や承認がなければ静的確認で止める。構文確認のつもりで通常起動・Reload や、未確認の「構文チェック専用」コマンドを実行しない。

変更後は、使用した AHK の版、実行したコマンド・操作と結果、未実施の検証と理由を報告する。静的確認しか行えなければ動作確認済みとは報告しない。
