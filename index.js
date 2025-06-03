// 載入環境變數
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 初始化 Discord 客戶端
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// 獲取 BOT_TOKEN
const token = process.env.BOT_TOKEN;
if (!token) {
  console.error(`
====================================
❌ 無法啟動 Bot：BOT_TOKEN 未在環境變數中定義
====================================
  `);
  process.exit(1);
}

// 載入事件處理程序
const eventsPath = path.join(__dirname, 'build', 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  try {
    const event = require(path.join(eventsPath, file));
    if (!event.name || !event.execute) {
      console.warn(`⚠️ 跳過無效事件文件：${file}（缺少 name 或 execute）`);
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
      console.log(`✅ 註冊一次性事件：${event.name} (${file})`);
    } else {
      client.on(event.name, (...args) => event.execute(...args));
      console.log(`✅ 註冊持續事件：${event.name} (${file})`);
    }
  } catch (error) {
    console.error(`
====================================
❌ 載入事件 ${file} 時出錯
📜 錯誤詳情：${error.message}
====================================
    `);
  }
}

// 啟動 Bot
client.login(token).then(() => {
  console.log(`
====================================
🚀 Bot 正在啟動...
====================================
  `);
}).catch(error => {
  console.error(`
====================================
❌ Bot 登錄失敗
📜 錯誤詳情：${error.message}
====================================
  `);
  process.exit(1);
});
