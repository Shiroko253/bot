import { Client, ActivityType } from 'discord.js';
import fs from 'fs';
import path from 'path';

// 事件名稱
export const name = 'ready';

// 僅執行一次
export const once = true;

// 執行函數
export function execute(client: Client): void {
  // 確保 client.user 存在
  if (!client.user) {
    console.error(`
====================================
❌ 無法設置狀態：client.user 未定義
📅 時間: ${new Date().toISOString()}
====================================
    `);
    return;
  }

  // 獲取命令數量
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandCount = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js')).length;

  // 定義多個活動狀態
  const activities = [
    { name: `已載入 ${commandCount} 個命令`, type: ActivityType.Playing },
    { name: `服務 ${client.guilds.cache.size} 個伺服器`, type: ActivityType.Watching },
    { name: '米津玄師', type: ActivityType.Listening },
  ];

  // 設置初始狀態
  client.user.setPresence({
    status: 'idle', // 可選：'online', 'idle', 'dnd', 'invisible'
    activities: [activities[0]],
  });

  // 每 30 秒切換一次活動狀態
  let activityIndex = 0;
  setInterval(() => {
    activityIndex = (activityIndex + 1) % activities.length;
    client.user?.setPresence({
      status: 'online',
      activities: [activities[activityIndex]],
    });
    console.log(`🔄 更新活動狀態：${activities[activityIndex].name}`);
  }, 30000);

  // 美化的日誌輸出
  console.log(`
====================================
✅ Bot 已成功上線
📅 時間: ${new Date().toISOString()}
👤 用戶: ${client.user.tag}
🆔 ID: ${client.user.id}
🌐 服務器數量: ${client.guilds.cache.size}
📜 命令數量: ${commandCount}
====================================
  `);
}
