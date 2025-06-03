import { REST, Routes, RESTPostAPIApplicationCommandsJSONBody } from 'discord.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// 載入環境變數
dotenv.config();

// 初始化命令數組
const commands: RESTPostAPIApplicationCommandsJSONBody[] = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

// 動態加載命令
for (const file of commandFiles) {
  try {
    const command = require(path.join(commandsPath, file));
    if (command?.data?.toJSON && typeof command.data.toJSON === 'function') {
      commands.push(command.data.toJSON());
      console.log(`✅ 已加載命令: ${file}`);
    } else {
      console.warn(`⚠️ 跳過無效命令文件: ${file}`);
    }
  } catch (error) {
    console.error(`❌ 加載命令 ${file} 時出錯:`, error);
  }
}

// 從環境變數獲取 token 和 clientId
const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;

// 驗證環境變數
if (!token) {
  throw new Error('❌ BOT_TOKEN 未在環境變數中定義');
}
if (!clientId) {
  throw new Error('❌ CLIENT_ID 未在環境變數中定義');
}

// 初始化 REST 客戶端
const rest = new REST({ version: '10' }).setToken(token);

// 部署斜線指令
(async () => {
  try {
    console.log(`
====================================
🚀 開始部署斜線指令
📂 命令數量: ${commands.length}
====================================
    `);

    const data = await rest.put(Routes.applicationCommands(clientId), { body: commands }) as { length: number };

    console.log(`
====================================
✅ 斜線指令部署完成
📊 已部署 ${data.length} 個命令
====================================
    `);
  } catch (error) {
    console.error(`
====================================
❌ 部署斜線指令失敗
📜 錯誤詳情: ${error}
====================================
    `);
  }
})();
