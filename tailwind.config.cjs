/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

4. 「Commit new file」

---

## 📝 **修正内容の説明**

- `package.json` に `"type": "module"` が指定されている（ES Modules 使用）
- CommonJS 形式のファイル（`module.exports`）は `.cjs` 拡張子が必要
- `.js` ファイルは ES Modules 形式（`export default`）である必要がある

---

## 📁 **修正後のファイル構造**
```
jstqb-exam/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js          ← ES Modules (そのまま)
├── postcss.config.cjs      ← CommonJS (.cjs に変更)
├── tailwind.config.cjs     ← CommonJS (.cjs に変更)
├── index.html
└── .gitignore
```

---

## 🔄 **デプロイ実行**

GitHub でコミット後、1-2分で Vercel が自動再デプロイを開始します。

今回は成功するはずです！ ✅

成功メールが届いたら、以下の URL を iPhone で開いてください：
```
https://jstqb-exam.vercel.app
