import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import fs from 'fs';
import path from 'path';

const economyDir = path.join(__dirname, '..', 'economys');
if (!fs.existsSync(economyDir)) fs.mkdirSync(economyDir);

// === v2修改區塊開始 ===
function getEconomyFileName(guildId: string, userId: string) {
  // 用 guildId_userId.json 作為檔名，防止跨群組用戶資料混亂
  return path.join(economyDir, `${guildId}_${userId}.json`);
}
// === v2修改區塊結束 ===

function getUserEconomy(guildId: string, userId: string) {
  // === v2修改區塊開始 ===
  const filePath = getEconomyFileName(guildId, userId);
  // === v2修改區塊結束 ===
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ balance: 0 }, null, 2));
    return { balance: 0 };
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function setUserEconomy(guildId: string, userId: string, data: any) {
  // === v2修改區塊開始 ===
  const filePath = getEconomyFileName(guildId, userId);
  // === v2修改區塊結束 ===
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export const data = new SlashCommandBuilder()
  .setName('addmoney')
  .setDescription('給用戶增加金錢（只有擁有者可以執行）')
  .addUserOption(option =>
    option.setName('target').setDescription('目標用戶').setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('amount').setDescription('增加金額').setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const ownerId = process.env.OWNER_ID;
  if (interaction.user.id !== ownerId) {
    return interaction.reply({ content: '你沒有權限執行此命令。', ephemeral: true });
  }

  // === v2修改區塊開始 ===
  const guildId = interaction.guildId;
  if (!guildId) return interaction.reply({ content: '只能在伺服器內使用本指令。', ephemeral: true });
  // === v2修改區塊結束 ===

  const user = interaction.options.getUser('target', true);
  const amount = interaction.options.getInteger('amount', true);

  if (amount <= 0) {
    return interaction.reply({ content: '金額必須大於 0。', ephemeral: true });
  }

  // === v2修改區塊開始 ===
  const eco = getUserEconomy(guildId, user.id);
  eco.balance += amount;
  setUserEconomy(guildId, user.id, eco);

  await interaction.reply({
    content: `已成功給 <@${user.id}> 增加 ${amount} 金幣（現有餘額：${eco.balance}）`
  });
  // === v2修改區塊結束 ===
}
