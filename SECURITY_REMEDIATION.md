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

## どこを、何を、どう修正するか

### 1. `src/App.jsx` の修正

以下のハードコードされたGoogle Apps Script URLを削除してください。

```javascript
const GAS_FILE_LIST_URL = 'https://script.google.com/macros/s/AKfycbxi1NOTkaDgFctucHZRweVOl7ZIg85VGUJ3QI9ozhOPWm8CG__-nvVj9TvazKWZatot_A/exec';
```

この行を削除し、代わりに以下に置き換えてください。

```javascript
const GAS_FILE_LIST_URL = '/api/files';
```

#### 実際のコード変更例

```javascript
// 変更前
const GAS_FILE_LIST_URL = 'https://script.google.com/macros/s/AKfycbxi1NOTkaDgFctucHZRweVOl7ZIg85VGUJ3QI9ozhOPWm8CG__-nvVj9TvazKWZatot_A/exec';

// 変更後
const GAS_FILE_LIST_URL = '/api/files';
```

#### 取得処理の修正

```javascript
// 変更前
const res = await fetch(GAS_FILE_LIST_URL);

// 変更後
const res = await fetch('/api/files');
```

理由:
- フロントエンドのソースコードにURLが残ると、ビルド済みファイルにも埋め込まれる可能性がある
- URLをサーバー側の環境変数で管理し、アプリ側はプロキシAPI経由で呼び出す

---

### 2. `api/files.js` の役割

`api/files.js` は、Google Apps ScriptのURLを環境変数で保持し、ブラウザからの `/api/files` に対して安全に転送する役割です。

```javascript
export default async function handler(req, res) {
  const gasUrl = process.env.GAS_FILE_LIST_URL;

  if (!gasUrl) {
    return res.status(500).json({ error: 'GAS_FILE_LIST_URL is not configured' });
  }

  try {
    const gasRes = await fetch(gasUrl, { redirect: 'follow' });
    const data = await gasRes.json();

    if (!gasRes.ok) {
      return res.status(gasRes.status).json({ error: data?.error || 'Failed to fetch spreadsheet list' });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
```

このAPIを使うことで、ブラウザのソースコードからURL自体が見えなくなります。

---

### 3. `api/last-updated.js` の修正

`api/last-updated.js` には、もう一つのGoogle Apps Script URLがハードコードされていました。

```javascript
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyZseKn9rTVgRD9rtt6c6ozQvIWQbaLWwcVaop-T1pakJXTM-LYMkgCMw1qeIahSFYVIw/exec';
```

以下のように修正してください。

```javascript
const gasUrl = process.env.GAS_URL;

if (!gasUrl) {
  return res.status(500).json({ error: 'GAS_URL is not configured' });
}
```

そのうえで、fetch先を `gasUrl` に置き換えてください。

```javascript
const gasRes = await fetch(gasUrl, { redirect: 'follow' });
```

---

### 4. `.env.example` の設定

以下を `.env.example` に記載しています。

```env
GAS_URL=https://script.google.com/macros/s/REPLACE_WITH_LAST_UPDATED_DEPLOYMENT_ID/exec
GAS_FILE_LIST_URL=https://script.google.com/macros/s/REPLACE_WITH_FILE_LIST_DEPLOYMENT_ID/exec
```

実際の値は `.env` に保存し、GitHubには push しないでください。

---

### 5. `.gitignore` の設定

以下のように `.env` / `.env.*` を除外してください。

```gitignore
.env
.env.*
!.env.example
```

---

### 6. Git履歴の再書き込み

ファイル修正だけでは、これまでのコミット履歴には旧URLが残る可能性があります。

そのため、下記を実施して履歴を洗浄してください。

```bash
git filter-repo --replace-text <(cat <<'EOF'
https://script.google.com/macros/s/AKfycbyZseKn9rTVgRD9rtt6c6ozQvIWQbaLWwcVaop-T1pakJXTM-LYMkgCMw1qeIahSFYVIw/exec==>REDACTED
https://script.google.com/macros/s/AKfycbxi1NOTkaDgFctucHZRweVOl7ZIg85VGUJ3QI9ozhOPWm8CG__-nvVj9TvazKWZatot_A/exec==>REDACTED
EOF
)
```

その後、force push を行います。

```bash
git push --force --all
git push --force --tags
```

---

### 7. Google Apps Script側の対応

旧URLは公開済みとみなして、次を実施してください。

- 旧デプロイを停止または無効化
- 新しいGASデプロイを作成
- 新しいURLをホスティングサービスの環境変数に設定
- 実行ログで不審なアクセスがないか確認

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
