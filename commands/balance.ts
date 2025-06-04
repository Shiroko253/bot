import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

// 經濟資料夾
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

export const data = new SlashCommandBuilder()
  .setName('balance')
  .setDescription('查詢你目前的金錢餘額');

export async function execute(interaction: ChatInputCommandInteraction) {
  // === v2修改區塊開始 ===
  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  if (!guildId) {
    return interaction.reply({ content: '只能在伺服器內使用本指令。', ephemeral: true });
  }

  const eco = getUserEconomy(guildId, userId);

  const embed = new EmbedBuilder()
    .setTitle('💰 餘額查詢')
    .setDescription(`<@${userId}> 目前在本伺服器擁有 **${eco.balance}** 金幣`)
    .setColor(0xFFD700);

  await interaction.reply({ embeds: [embed], ephemeral: true });
  // === v2修改區塊結束 ===
}
