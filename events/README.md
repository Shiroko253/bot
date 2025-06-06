# 📁 `events/` Folder Readme / `events/` 資料夾說明

This folder contains event modules for the `Yuyuko_bot-y2` Discord bot.
此資料夾包含 `Yuyuko_bot-y2` Discord 機器人的事件模組。
每個檔案對應一個由 Discord API 發出的事件。
這些模組應使用 TypeScript 或 JavaScript 編寫，並在執行前進行編譯。

---

## 📜 Files Overview / 檔案概覽

### `ready.ts`

* **Description 描述：** Triggered when the bot has successfully logged in.
  當機器人成功登入時觸發。
* **Usage 用途：** Useful for initialization tasks such as setting bot status, logging startup info, or preparing resources.
  用於設定機器人狀態、顯示啟動訊息、初始化資源等。

### `interactionCreate.ts`

* **Description 描述：** Triggered whenever an interaction is created (e.g. slash commands, button clicks).
  當有互動事件產生時觸發（例如斜線指令、按鈕點擊等）。
* **Usage 用途：** Handles all user interaction logic, routes to appropriate command handlers, and provides feedback.
  處理所有使用者互動邏輯，並路由至對應的指令處理器，回應使用者。

---

## 📌 Notes / 注意事項

* These files must export an object or function that follows the structure required by your bot's event handler loader.
  這些檔案必須輸出符合機器人事件加載器所需格式的物件或函式。
* Event modules will be compiled to `build/events/` and dynamically loaded by `index.js` at runtime.
  事件模組將被編譯至 `build/events/`，並在執行時由 `index.js` 動態加載。
* Keep each file focused on a single event for better maintainability.
  每個檔案應只專注處理一個事件，以便於維護。

---

## 📄 Licensing / 授權條款

This project is licensed under the **GNU General Public License v3.0**.
本項目依據 **GNU 通用公共授權條款第 3 版 (GPL v3.0)** 授權。
See [LICENSE](../LICENSE) for more details.
詳情請參閱 [LICENSE](../LICENSE)。
