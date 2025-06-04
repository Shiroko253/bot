import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import fs from 'fs';
import path from 'path';

// 經濟資料夾的路徑，若不存在則自動建立
const economyDir = path.join(__dirname, '..', 'economys');
if (!fs.existsSync(economyDir)) fs.mkdirSync(economyDir);

/**
 * 根據 guildId 和 userId 生成經濟資料檔案的完整路徑
 */
function getEconomyFileName(guildId: string, userId: string) {
  return path.join(economyDir, `${guildId}_${userId}.json`);
}

/**
 * 讀取指定用戶的經濟資料，若不存在則建立新檔案並返回初始資料
 */
function getUserEconomy(guildId: string, userId: string) {
  const filePath = getEconomyFileName(guildId, userId);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ balance: 0 }, null, 2));
    return { balance: 0 };
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * 寫入指定用戶的經濟資料
 */
function setUserEconomy(guildId: string, userId: string, data: any) {
  const filePath = getEconomyFileName(guildId, userId);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
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

/**
 * /pay 指令主體，讓用戶給另一用戶轉帳金幣
 */
export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  const fromId = interaction.user.id;
  const toUser = interaction.options.getUser('target', true);
  const toId = toUser.id;
  const amount = interaction.options.getInteger('amount', true);

  if (!guildId) return interaction.reply({ content: '只能在伺服器中執行本指令。', ephemeral: true });
  if (amount <= 0) return interaction.reply({ content: '轉帳金額必須大於 0。', ephemeral: true });
  if (fromId === toId) return interaction.reply({ content: '不能給自己轉帳！', ephemeral: true });

  const fromEco = getUserEconomy(guildId, fromId);
  const toEco = getUserEconomy(guildId, toId);

  if (fromEco.balance < amount) {
    return interaction.reply({ content: '你的金幣餘額不足。', ephemeral: true });
  }

  fromEco.balance -= amount;
  toEco.balance += amount;
  setUserEconomy(guildId, fromId, fromEco);
  setUserEconomy(guildId, toId, toEco);

  await interaction.reply({
    content: `轉帳成功！你已給 <@${toId}> 轉帳 ${amount} 金幣。\n你目前餘額：${fromEco.balance} 金幣`
  });
}
