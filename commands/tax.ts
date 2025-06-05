import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionsBitField } from 'discord.js';
import fs from 'fs';
import path from 'path';

const economyDir = path.join(__dirname, '..', 'economys');
const bankPath = path.join(economyDir, 'server_bank.json');

function getEconomyFile(guildId: string) {
  return path.join(economyDir, `${guildId}.json`);
}
function getGuildEconomy(guildId: string): Record<string, { balance: number }> {
  const filePath = getEconomyFile(guildId);
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
function setGuildEconomy(guildId: string, data: Record<string, { balance: number }>) {
  const filePath = getEconomyFile(guildId);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
function getServerBank(): Record<string, any> {
  if (!fs.existsSync(bankPath)) return {};
  return JSON.parse(fs.readFileSync(bankPath, 'utf8'));
}
function setServerBank(data: Record<string, any>) {
  fs.writeFileSync(bankPath, JSON.stringify(data, null, 2));
}
function formatNumber(num: number): string {
  if (num >= 1e20) return `${(num / 1e20).toFixed(2)} 兆京`;
  if (num >= 1e16) return `${(num / 1e16).toFixed(2)} 京`;
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)} 兆`;
  if (num >= 1e8) return `${(num / 1e8).toFixed(2)} 億`;
  return `${num.toFixed(2)}`;
}

export const data = new SlashCommandBuilder()
  .setName('tax')
  .setDescription('幽幽子對伺服器內所有用戶徵收稅金，存入國庫～')
  .addIntegerOption(option =>
    option
      .setName('rate')
      .setDescription('稅率（百分比，預設20，最大100）')
      .setMinValue(1)
      .setMaxValue(100)
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  const guildId = guild?.id;
  const executor = interaction.member;
  if (!guild || !guildId || !executor) {
    await interaction.reply({ content: '只能在伺服器中使用本指令', ephemeral: true });
    return;
  }

  // 權限檢查（需有管理員權限）
  const isAdmin =
    interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator) ||
    ((interaction.member as any)?.permissions?.has?.(PermissionsBitField.Flags.Administrator));
  if (!isAdmin) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('🌸 權限不足！🌸')
          .setDescription('只有管理員才能徵稅哦～')
          .setColor('Red')
      ],
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply();

  // 讀取稅率
  const inputRate = interaction.options.getInteger('rate', false) ?? 20;
  const safeRate = Math.min(100, Math.max(1, inputRate));
  const taxRate = safeRate / 100;

  // 課稅
  const guildEco = getGuildEconomy(guildId);
  let totalTax = 0;
  let taxedUsers: { userId: string, amount: number, name: string }[] = [];

  for (const [userId, userEco] of Object.entries(guildEco)) {
    if (userEco.balance <= 0) continue;
    const taxAmount = Math.round(userEco.balance * taxRate * 100) / 100;
    if (taxAmount <= 0) continue;
    userEco.balance = Math.round((userEco.balance - taxAmount) * 100) / 100;
    totalTax += taxAmount;

    let username = `用戶ID: ${userId}`;
    try {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (member) username = member.displayName;
    } catch {}
    taxedUsers.push({ userId, amount: taxAmount, name: username });
  }

  if (taxedUsers.length === 0) {
    await interaction.followUp({
      embeds: [
        new EmbedBuilder()
          .setTitle('🌸 無人可稅！🌸')
          .setDescription('這個伺服器還沒有人有幽靈幣哦～快去玩遊戲賺錢吧！')
          .setColor('Red')
      ]
    });
    return;
  }

  setGuildEconomy(guildId, guildEco);

  // 國庫紀錄
  const serverBank = getServerBank();
  if (!serverBank[guildId]) {
    serverBank[guildId] = { total: 0, records: [] };
  }
  serverBank[guildId].total = Math.round((serverBank[guildId].total + totalTax) * 100) / 100;
  serverBank[guildId].records = serverBank[guildId].records || [];
  serverBank[guildId].records.push({
    by: (interaction.member as any).displayName || interaction.user.username,
    byId: interaction.user.id,
    at: Date.now(),
    taxed: taxedUsers.map(u => ({ userId: u.userId, amount: u.amount })),
    rate: safeRate,
    sum: Math.round(totalTax * 100) / 100
  });
  setServerBank(serverBank);

  // embed
  const taxedList = taxedUsers
    .map(u => `**${u.name}**：${formatNumber(u.amount)} 幽靈幣`)
    .join('\n');

  const embed = new EmbedBuilder()
    .setTitle('🌸 幽幽子的稅金徵收！🌸')
    .setDescription(
      `幽幽子對伺服器內所有用戶徵收了 **${safeRate}%** 的稅金，存入國庫～\n` +
      `徵稅執行者：**${(interaction.member as any).displayName || interaction.user.username}**\n\n` +
      `被徵稅者：\n${taxedList}\n\n` +
      `總稅金：${formatNumber(totalTax)} 幽靈幣\n` +
      `國庫當前餘額：${formatNumber(serverBank[guildId].total)} 幽靈幣`
    )
    .setColor(0xFFB6C1);

  await interaction.followUp({ embeds: [embed] });
}
