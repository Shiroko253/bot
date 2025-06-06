# 👻 Welcome to `Yuyuko_bot-y2`

```py
print(f"Hello, user! Please run `npm install typescript ts-node @types/node --save-dev` to install the required packages. Get ready to build Yuyuko bot 2nd generation!")
```

---

## 📆 Project Setup / 項目設置

### 💻 Programming Languages / 程式語言

* 主要進入點: **JavaScript (`index.js`)**
* 指令與事件模組: **TypeScript 或 JavaScript** (`commands/` 和 `events/` 資料夾)

---

## 📂 Required Packages & Installation / 必須套件與安裝步驟

### ✅ 1. Initialize Project / 初始化項目

```bash
npm init -y
```

### ✅ 2. Install Dependencies / 安裝套件

**開發套件 Development dependencies:**

```bash
npm install typescript ts-node @types/node --save-dev
```

**執行時套件 Runtime dependencies:**

```bash
npm install discord.js dotenv
```

### ✅ 3. Create TypeScript Configuration / 創建 tsconfig

```bash
npx tsc --init
```

**建議的 `tsconfig.json` 設定 (限定編譯 `commands/` 和 `events/`):**

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./build",
    "skipLibCheck": true
  },
  "include": ["commands/**/*", "events/**/*"]
}
```

---

## 📁 Project Structure 項目相關目錄 (範例)

```
/project-root
├── index.js        # 主進入點 (JS)
├── commands/       # 指令模組 (TS/JS)
├── events/         # 事件模組 (TS/JS)
├── build/          # TS 編譯成的 JS 輸出目錄
├── tsconfig.json   # TypeScript 設定
└── .env            # 環境變數
```

* **index.js**: 主進入文件，加載 `build/commands/` 與 `build/events/` 的 JS 檔案
* **commands/** 與 **events/**: 建議使用 TypeScript 編写功能
* **build/**: 儲存編譯後 JS 檔案，勿直接編讏

---

## 🚀 Development Workflow / 開發與啟動流程

1. ✏️ **開發 Development**
   在 `commands/` 與 `events/` 使用 TypeScript 編写模組

2. ✈️ **編譯 TypeScript**

   ```bash
   npx tsc
   ```

   將 TS 編譯成 JS ，用於 `build/`

3. 🚀 **啟動機器人 Start the bot**

   ```bash
   node index.js
   ```

   * `index.js` 只加載 `build/` 中的 JS 檔案，不可加載 TS 原始檔

---

## 🔒 Notes / 註意事項

* `index.js` 只能加載 JS 檔案，不能直接引入 TS 檔
* 秘密資訊 (e.g. Discord Token) 請放在 `.env`
* `commands/` 與 `events/` 僅為原始碼目錄，啟動時請使用 `build/`
* 請勿將模組直接放在根目錄

---

## 📄 License / 授權條款

本項目授權下許於 **GNU General Public License v3.0**
請參閱 [LICENSE](./LICENSE) 獲取詳細資訊
