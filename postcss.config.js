export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

### **ステップ5: Vercelでデプロイ（3分）**

**5-1. Vercelにアクセス**
```
https://vercel.com
```

**5-2. 「Sign Up」をクリック**

**5-3. 「Continue with GitHub」を選択**
- GitHubアカウントで認可

**5-4. 「Import Project」をクリック**

**5-5. リポジトリを選択**
```
GitHub URL を入力: https://github.com/YOUR_USERNAME/jstqb-exam
```

または「From Git Repository」から直接選択

**5-6. プロジェクト設定**
- Project Name: `jstqb-exam`
- Framework Preset: 「Other」を選択
- その他はデフォルトのまま

**5-7. 「Deploy」をクリック**

⏳ デプロイ開始（1-2分待機）

✅ **デプロイ完了！**

画面に `https://jstqb-exam.vercel.app` のようなURLが表示されます

---

### **ステップ6: iPhoneで開く（1分）**

**6-1. iPhoneのSafariを開く**

**6-2. 以下のURLを入力**
```
https://jstqb-exam.vercel.app
```

**6-3. アクセス！**

---

### **ステップ7: ホーム画面に追加（オプション）**

iPhoneをアプリのように使う方法：
```
1. Safari の下部「共有」ボタンをタップ
2. 「ホーム画面に追加」を選択
3. 名前を入力（例: 「JSTQB模試」）
4. 「追加」をタップ
5. ホーム画面にアプリアイコンが追加されます
```

---

## 🔗 **他の人に共有する方法**

### **方法1: URLを直接シェア**
```
デプロイ完了後のURL:
https://jstqb-exam.vercel.app

これを以下の方法でシェア:
- メール
- LINE
- Slack
- WhatsApp
- Twitter
```

### **方法2: QRコードを生成**

QRコード生成サイトで以下を入力:
```
https://jstqb-exam.vercel.app
```

※ QRコード生成サイト例:
- https://qr-code-generator.com
- https://www.qr-code-generator.jp

### **方法3: 短縮URL**

Bitlyなどで短くする:
```
https://bit.ly/jstqb-exam
```

---

## 📝 **更新方法（コードを変更した場合）**

**新しい問題を追加したい場合:**

1. GitHubリポジトリの `src/App.jsx` を編集
2. コードを修正
3. 「Commit changes」をクリック
4. Vercelが自動で再デプロイ（1-2分）
5. 変更が反映される

---

## ❓ **トラブルシューティング**

| 問題 | 解決方法 |
|------|--------|
| **Vercelでビルドエラー** | GitHubリポジトリの設定を確認 |
| **iPhoneでアクセスできない** | インターネット接続を確認 |
| **URLが表示されない** | Vercelダッシュボードで確認 |
| **デプロイが失敗** | GitHub での node_modules/ フォルダを確認 |

---

## 🎯 **確認チェックリスト**
```
✅ GitHubアカウント作成済み
✅ リポジトリ作成済み（jstqb-exam）
✅ 9つのファイルをアップロード
✅ Vercelアカウント作成済み
✅ デプロイ完了
✅ iPhoneでURL確認
✅ ホーム画面に追加（オプション）
