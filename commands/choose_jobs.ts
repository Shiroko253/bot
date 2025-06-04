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

// 可選的職業列表
const jobs = [
  { name: '冒險者', value: 'adventurer' },
  { name: '農夫', value: 'farmer' },
  { name: '礦工', value: 'miner' },
  { name: '商人', value: 'merchant' },
];

export const data = new SlashCommandBuilder()
  .setName('choose_jobs')
  .setDescription('選擇你的職業')
  .addStringOption(option =>
    option
      .setName('job')
      .setDescription('請選擇職業')
      .setRequired(true)
      .addChoices(...jobs.map(j => ({ name: j.name, value: j.value })))
  );

/**
 * /choose_jobs 指令主體，讓用戶選擇職業並存入經濟檔案
 */
export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;
  const job = interaction.options.getString('job', true);

  if (!guildId) return interaction.reply({ content: '只能在伺服器中執行本指令。', ephemeral: true });

  const eco = getUserEconomy(guildId, userId);
  eco.job = job;
  setUserEconomy(guildId, userId, eco);

  const jobName = jobs.find(j => j.value === job)?.name ?? job;
  await interaction.reply({ content: `你已選擇職業：${jobName}` });
}
