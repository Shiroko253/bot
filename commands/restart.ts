import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { exec } from 'child_process';

export const data = new SlashCommandBuilder()
  .setName('restart')
  .setDescription('🔁 重新啟動機器人（只有擁有者可以執行）');

export async function execute(interaction: CommandInteraction) {
  const ownerId = process.env.OWNER_ID;
  const pm2Name = process.env.PM2_PROCESS_NAME || 'your-bot-name-or-id';

  // 檢查 OWNER_ID 是否設置
  if (!ownerId) {
    console.error('[SYSTEM] 未設置 OWNER_ID 環境變數，無法執行重啟命令');
    return interaction.reply({
      content: '系統管理員尚未正確設置 OWNER_ID，請聯絡管理員。',
      ephemeral: true,
    });
  }

  // 檢查權限
  if (interaction.user.id !== ownerId) {
    return interaction.reply({
      content: '你沒有權限重新啟動機器人！',
      ephemeral: true,
    });
  }

  try {
    await interaction.reply('🔁 正在重新啟動機器人...');
    console.log(`[SYSTEM] Bot 被擁有者 (${interaction.user.tag}, ${interaction.user.id}) 手動重啟於 ${new Date().toISOString()}`);
  } catch (error: unknown) {
    let msg = '未知錯誤';
    if (error instanceof Error) msg = error.message;
    console.error(`[SYSTEM] 回覆重啟訊息時發生錯誤: ${msg}`);
    return;
  }

  // PM2 名稱檢查
  if (!pm2Name) {
    console.error('[SYSTEM] 未設置 PM2_PROCESS_NAME，無法執行重啟命令');
    return;
  }

  // 延遲 1 秒給 Discord 回應時間
  setTimeout(() => {
    exec(`pm2 restart ${pm2Name}`, (err, stdout, stderr) => {
      if (err) {
        console.error(`[SYSTEM] 重啟失敗: ${err instanceof Error ? err.message : String(err)}`);
        return;
      }
      if (stderr) {
        console.warn(`[SYSTEM] 重啟警告: ${stderr}`);
      }
      console.log(`[SYSTEM] PM2 重啟成功: ${stdout}`);
    });
  }, 1000);
}

// 注意：必須在環境變數中定義 OWNER_ID 與 PM2_PROCESS_NAME（或預設為 your-bot-name-or-id）。
