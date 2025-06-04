import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import fs from 'fs';
import path from 'path';

// 經濟資料夾
const economyDir = path.join(__dirname, '..', 'economys');
if (!fs.existsSync(economyDir)) fs.mkdirSync(economyDir);

/**
 * 取得本群組經濟檔案路徑
 */
function getEconomyFileName(guildId: string) {
  return path.join(economyDir, `${guildId}.json`);
}

/**
 * 讀取本群組所有用戶經濟資料
 */
function getGuildEconomy(guildId: string): Record<string, { balance: number }> {
  const filePath = getEconomyFileName(guildId);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    return {};
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * 取得某用戶經濟資料（不存在就初始化為 { balance: 0 }）
 */
function getUserEconomy(guildId: string, userId: string) {
  const allEco = getGuildEconomy(guildId);
  if (!allEco[userId]) {
    allEco[userId] = { balance: 0 };
    setGuildEconomy(guildId, allEco);
  }
  return allEco[userId];
}

/**
 * 設定本群組經濟資料
 */
function setGuildEconomy(guildId: string, guildEco: Record<string, { balance: number }>) {
  const filePath = getEconomyFileName(guildId);
  fs.writeFileSync(filePath, JSON.stringify(guildEco, null, 2));
}

export const data = new SlashCommandBuilder()
  .setName('balance')
  .setDescription('查詢你目前的金錢餘額');

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  if (!guildId) {
    return interaction.reply({ content: '只能在伺服器內使用本指令。', flags: MessageFlags.Ephemeral });
  }

  const eco = getUserEconomy(guildId, userId);

  const embed = new EmbedBuilder()
    .setTitle('💰 餘額查詢')
    .setDescription(`<@${userId}> 目前在本伺服器擁有 **${eco.balance}** 金幣`)
    .setColor(0xFFD700);

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
