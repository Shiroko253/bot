import { Client, Interaction } from 'discord.js';
import fs from 'fs';
import path from 'path';

// 事件名稱
export const name = 'interactionCreate';

// 非一次性事件
export const once = false;

// 預先載入命令並緩存
const commandsPath = path.join(__dirname, '..', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
const commands = new Map<string, any>();

for (const file of commandFiles) {
  try {
    const command = require(path.join(commandsPath, file));
    if (command?.data?.name && typeof command.execute === 'function') {
      commands.set(command.data.name, command);
      console.log(`✅ 成功緩存命令：${command.data.name} (${file})`);
    } else {
      console.warn(`⚠️ 跳過無效命令文件：${file}（缺少 name 或 execute）`);
    }
  } catch (error: unknown) {
    let errorMsg = '未知錯誤';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error(`
====================================
❌ 載入命令 ${file} 時出錯
📜 錯誤詳情：${errorMsg}
📅 時間：${new Date().toISOString()}
====================================
    `);
  }
}

// 執行函數
export async function execute(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) {
    return; // 僅處理聊天輸入命令（斜線指令）
  }

  const command = commands.get(interaction.commandName);
  if (!command) {
    console.error(`
====================================
❌ 未找到命令：${interaction.commandName}
📅 時間：${new Date().toISOString()}
====================================
    `);
    await interaction.reply({ content: '未找到該命令！', ephemeral: true });
    return;
  }

  try {
    await command.execute(interaction);
    console.log(`
====================================
✅ 成功執行命令：${interaction.commandName}
👤 用戶：${interaction.user.tag}
🆔 伺服器：${interaction.guild?.name || '私訊'}
📅 時間：${new Date().toISOString()}
====================================
    `);
  } catch (error: unknown) {
    let errorMsg = '未知錯誤';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    console.error(`
====================================
❌ 執行命令 ${interaction.commandName} 失敗
📜 錯誤詳情：${errorMsg}
📅 時間：${new Date().toISOString()}
====================================
    `);
    const replyContent = { content: '執行命令時發生錯誤，請稍後重試！', ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(replyContent);
    } else {
      await interaction.reply(replyContent);
    }
  }
}
