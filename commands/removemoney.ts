import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import fs from 'fs';
import path from 'path';

const economyDir = path.join(__dirname, '..', 'economys');
if (!fs.existsSync(economyDir)) fs.mkdirSync(economyDir);

function getEconomyFileName(guildId: string, userId: string) {
  return path.join(economyDir, `${guildId}_${userId}.json`);
}

function getUserEconomy(guildId: string, userId: string) {
  const filePath = getEconomyFileName(guildId, userId);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ balance: 0 }, null, 2));
    return { balance: 0 };
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function setUserEconomy(guildId: string, userId: string, data: any) {
  const filePath = getEconomyFileName(guildId, userId);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
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
    return interaction.reply({ content: '你沒有權限執行此命令。', ephemeral: true });
  }

  const guildId = interaction.guildId;
  if (!guildId) return interaction.reply({ content: '只能在伺服器內使用本指令。', ephemeral: true });

  const user = interaction.options.getUser('target', true);
  const amount = interaction.options.getInteger('amount', true);

  if (amount <= 0) {
    return interaction.reply({ content: '金額必須大於 0。', ephemeral: true });
  }

  const eco = getUserEconomy(guildId, user.id);
  if (eco.balance < amount) {
    return interaction.reply({ content: '該用戶金幣不足，無法扣除。', ephemeral: true });
  }

  eco.balance -= amount;
  setUserEconomy(guildId, user.id, eco);

  await interaction.reply({
    content: `已成功扣除 <@${user.id}> ${amount} 金幣（現有餘額：${eco.balance}）`
  });
}
