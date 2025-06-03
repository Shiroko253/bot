import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('shutdown')
  .setDescription('🔒 關閉機器人（只有擁有者可以執行）');

export async function execute(interaction: CommandInteraction) {
  const ownerId = process.env.OWNER_ID;

  // 檢查 OWNER_ID 是否已正確設置
  if (!ownerId) {
    console.error('[SYSTEM] 未設置 OWNER_ID 環境變數，無法執行關閉命令');
    return interaction.reply({
      content: '系統管理員尚未正確設置 OWNER_ID，請聯絡管理員。',
      ephemeral: true,
    });
  }

  // 僅允許特定使用者
  if (interaction.user.id !== ownerId) {
    return interaction.reply({
      content: '你沒有權限關閉機器人！',
      ephemeral: true,
    });
  }

  try {
    await interaction.reply('👋 再見，我要關機了...');
    console.log(`[SYSTEM] Bot 被擁有者 (${interaction.user.tag}, ${interaction.user.id}) 手動關閉於 ${new Date().toISOString()}`);
  } catch (error: unknown) {
    let msg = '未知錯誤';
    if (error instanceof Error) msg = error.message;
    console.error(`[SYSTEM] 回覆關閉訊息時發生錯誤: ${msg}`);
  } finally {
    // 等待訊息送出後再退出
    setTimeout(() => process.exit(0), 1000);
  }
}

// 注意：必須在環境變數中定義 OWNER_ID，這是允許關閉機器人的使用者 ID。
