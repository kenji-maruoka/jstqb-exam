# セキュリティ対応記録

## 対象

- リポジトリ: `kenji-maruoka/jstqb-exam`
- 対応ブランチ: `fix/remove-hardcoded-gas-urls`
- 対応日: 2026-09-23

## 確認結果

公開されているソースコードに、Google Apps ScriptのWebアプリ実行URLが直接記述されていました。

- `api/last-updated.js`
- `src/App.jsx`

一般的な形式のAPIキー（AWS、GitHub、Slack、秘密鍵など）は確認した範囲では検出されませんでした。ただし、Google Apps Scriptの実行URLは公開済みの情報として扱い、旧URLの無効化または再発行を行う必要があります。

## 実施済みの変更

- `api/last-updated.js`
  - Google Apps ScriptのURLをソースコードから削除
  - `GAS_URL`環境変数から取得するよう変更
- `api/files.js`
  - ファイル一覧取得用のサーバーサイドプロキシを追加
  - `GAS_FILE_LIST_URL`環境変数から取得するよう変更
- `.env.example`
  - 必要な環境変数の設定例を追加
  - 実際のURLや秘密情報は記載していません
- `.gitignore`
  - `.env`および`.env.*`を除外
  - `.env.example`は追跡対象として保持

## 未完了の対応

以下はまだ完了していません。完了するまでは、このブランチを`main`へマージしないでください。

- `src/App.jsx`に残っているGoogle Apps Script URLの削除
- `src/App.jsx`のファイル一覧取得先を`/api/files`へ変更
- `npm run lint`の実行と成功確認
- `npm run build`の実行と成功確認
- Git履歴から旧URLを削除
- Google Apps Scriptの旧デプロイの無効化またはアクセス制限
- 新しいURLの発行とホスティング環境への環境変数登録

## 環境変数

本番環境またはローカルの非公開設定に、実際の値を登録してください。

```text
GAS_URL=<最終更新日時取得用の新しいGAS実行URL>
GAS_FILE_LIST_URL=<ファイル一覧取得用の新しいGAS実行URL>
```

実際の値を、このファイル、`.env.example`、ソースコード、README、コミットメッセージへ記載しないでください。

## 残作業の確認例

```bash
# 旧URLや代表的な秘密情報が残っていないか確認
# ※実行結果に秘密情報を含めたまま共有しないでください
grep -RInE 'script\\.google\\.com/macros/s/|AKfy|AKIA|ghp_|AIza|BEGIN .* PRIVATE KEY' \\
  --exclude-dir=node_modules \\
  --exclude-dir=.git \\
  .

npm run lint
npm run build
```

## 履歴清掃について

旧URLはすでに公開されたものとして扱ってください。ファイルから削除するだけでは、過去のコミットには残る可能性があります。履歴を書き換える場合は、先にバックアップを作成し、共同利用者へ通知してから実施してください。

履歴清掃後は、旧URLが無効化されていることを確認し、GitHub上のブランチやタグを含めて再確認してください。

## 注意

この記録は対応状況を残すためのものです。未完了の項目があるため、現時点ではセキュリティ対応完了を意味しません。
