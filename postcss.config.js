export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

5. **「Commit changes」をクリック**

---

## 💡 **他のファイルもチェック**

同じように他のファイルにもテキストが混入していないか確認してください：

- ✅ `package.json` - JSONファイル（テキストが含まれていないか）
- ✅ `vite.config.js` - JavaScriptファイル
- ✅ `tailwind.config.js` - JavaScriptファイル
- ✅ `index.html` - HTMLファイル

---

## 🔄 **修正後の自動デプロイ**

GitHub で修正をコミットすると、Vercel が自動で再ビルドを開始します。

1-2 分後に成功メールが来たら、以下の URL をiPhoneで開いてください：
```
https://jstqb-exam.vercel.app
```

---

## 📝 **GitHub上で正しく見えているか確認**

GitHub の各ファイルをクリックして、以下の確認をしてください：

**postcss.config.js の内容：**
```
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
