import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
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

/**
 * 設定某用戶經濟資料
 */
function setUserEconomy(guildId: string, userId: string, data: { balance: number }) {
  const allEco = getGuildEconomy(guildId);
  allEco[userId] = data;
  setGuildEconomy(guildId, allEco);
}

export const data = new SlashCommandBuilder()
  .setName('removemoney')
  .setDescription('扣除指定用戶金錢（只有擁有者可以執行）')
  .addUserOption(option =>
    option.setName('target').setDescription('目標用戶').setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('amount').setDescription('扣除金額').setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const ownerId = process.env.OWNER_ID;
  if (interaction.user.id !== ownerId) {
    return interaction.reply({ content: '你沒有權限執行此命令。', flags: MessageFlags.Ephemeral });
  }

  const guildId = interaction.guildId;
  if (!guildId) return interaction.reply({ content: '只能在伺服器內使用本指令。', flags: MessageFlags.Ephemeral });

  const user = interaction.options.getUser('target', true);
  const amount = interaction.options.getInteger('amount', true);

  if (amount <= 0) {
    return interaction.reply({ content: '金額必須大於 0。', flags: MessageFlags.Ephemeral });
  }

  const eco = getUserEconomy(guildId, user.id);
  if (eco.balance < amount) {
    return interaction.reply({ content: '該用戶金幣不足，無法扣除。', flags: MessageFlags.Ephemeral });
  }

  eco.balance -= amount;
  setUserEconomy(guildId, user.id, eco);

  await interaction.reply({
    content: `已成功扣除 <@${user.id}> ${amount} 金幣（現有餘額：${eco.balance}）`
  });
}
