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
  .setName('pay')
  .setDescription('轉帳金幣給其他用戶')
  .addUserOption(option =>
    option.setName('target').setDescription('收款對象').setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('amount').setDescription('轉帳金額').setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  const fromId = interaction.user.id;
  const toUser = interaction.options.getUser('target', true);
  const toId = toUser.id;
  const amount = interaction.options.getInteger('amount', true);

  if (!guildId) {
    return interaction.reply({ content: '只能在伺服器中執行本指令。', flags: MessageFlags.Ephemeral });
  }
  if (amount <= 0) {
    return interaction.reply({ content: '轉帳金額必須大於 0。', flags: MessageFlags.Ephemeral });
  }
  if (fromId === toId) {
    return interaction.reply({ content: '不能給自己轉帳！', flags: MessageFlags.Ephemeral });
  }

  const fromEco = getUserEconomy(guildId, fromId);
  const toEco = getUserEconomy(guildId, toId);

  if (fromEco.balance < amount) {
    return interaction.reply({ content: '你的金幣餘額不足。', flags: MessageFlags.Ephemeral });
  }

  fromEco.balance -= amount;
  toEco.balance += amount;
  setUserEconomy(guildId, fromId, fromEco);
  setUserEconomy(guildId, toId, toEco);

  await interaction.reply({
    content: `轉帳成功！你已給 <@${toId}> 轉帳 ${amount} 金幣。\n你目前餘額：${fromEco.balance} 金幣`
  });
}
