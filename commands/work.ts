import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import fs from 'fs';
import path from 'path';

const economyDir = path.join(__dirname, '..', 'economys');
const userJobsPath = path.join(__dirname, '..', 'config', 'user-jobs.json');
const jobsPath = path.join(__dirname, '..', 'config', 'jobs.json');
const cooldownDir = path.join(__dirname, '..', 'cooldowns');

if (!fs.existsSync(economyDir)) fs.mkdirSync(economyDir);
if (!fs.existsSync(cooldownDir)) fs.mkdirSync(cooldownDir);

function getEconomyFileName(guildId: string) {
  return path.join(economyDir, `${guildId}.json`);
}
function getGuildEconomy(guildId: string): Record<string, { balance: number }> {
  const filePath = getEconomyFileName(guildId);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    return {};
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
function getUserEconomy(guildId: string, userId: string) {
  const allEco = getGuildEconomy(guildId);
  if (!allEco[userId]) {
    allEco[userId] = { balance: 0 };
    setGuildEconomy(guildId, allEco);
  }
  return allEco[userId];
}
function setGuildEconomy(guildId: string, guildEco: Record<string, { balance: number }>) {
  const filePath = getEconomyFileName(guildId);
  fs.writeFileSync(filePath, JSON.stringify(guildEco, null, 2));
}
function setUserEconomy(guildId: string, userId: string, data: { balance: number }) {
  const allEco = getGuildEconomy(guildId);
  allEco[userId] = data;
  setGuildEconomy(guildId, allEco);
}

// 讀寫 user-jobs.json
function getAllUserJobs(): Record<string, Record<string, { job: string, stress: number }>> {
  if (!fs.existsSync(userJobsPath)) {
    fs.writeFileSync(userJobsPath, JSON.stringify({}, null, 2));
    return {};
  }
  return JSON.parse(fs.readFileSync(userJobsPath, 'utf8'));
}
function getUserJobData(guildId: string, userId: string): { job: string, stress: number } | null {
  const allJobs = getAllUserJobs();
  return allJobs[guildId]?.[userId] ?? null;
}
function setUserJobData(guildId: string, userId: string, jobData: { job: string, stress: number }) {
  const allJobs = getAllUserJobs();
  if (!allJobs[guildId]) allJobs[guildId] = {};
  allJobs[guildId][userId] = jobData;
  fs.writeFileSync(userJobsPath, JSON.stringify(allJobs, null, 2));
}

// cooldown
function getCooldownFile(guildId: string, userId: string) {
  return path.join(cooldownDir, `${guildId}_${userId}.json`);
}
function getCooldown(guildId: string, userId: string): number | null {
  const file = getCooldownFile(guildId, userId);
  if (!fs.existsSync(file)) return null;
  const { lastWork } = JSON.parse(fs.readFileSync(file, 'utf8'));
  return lastWork;
}
function setCooldown(guildId: string, userId: string, timestamp: number) {
  const file = getCooldownFile(guildId, userId);
  fs.writeFileSync(file, JSON.stringify({ lastWork: timestamp }, null, 2));
}

export const data = new SlashCommandBuilder()
  .setName('work')
  .setDescription('上班領取工資，有五分鐘冷卻，並會增加壓力值');

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  if (!guildId) {
    return interaction.reply({ content: '只能在伺服器中使用本指令。', flags: MessageFlags.Ephemeral });
  }

  // 職業與壓力
  const jobData = getUserJobData(guildId, userId);
  if (!jobData) {
    return interaction.reply({ content: '你尚未選擇職業，請先使用 /choose_jobs 選擇職業！', flags: MessageFlags.Ephemeral });
  }

  // 檢查冷卻
  const cooldown = getCooldown(guildId, userId);
  const now = Date.now();
  const cooldownTime = 5 * 60 * 1000; // 5分鐘
  if (cooldown && now - cooldown < cooldownTime) {
    const left = Math.ceil((cooldownTime - (now - cooldown)) / 1000);
    const min = Math.floor(left / 60);
    const sec = left % 60;
    return interaction.reply({
      content: `你還需要等待 ${min > 0 ? `${min}分` : ''}${sec}秒 才能再次工作。`,
      flags: MessageFlags.Ephemeral
    });
  }

  // 讀取職業工資範圍
  if (!fs.existsSync(jobsPath)) {
    return interaction.reply({ content: '找不到職業資料，請聯絡管理員。', flags: MessageFlags.Ephemeral });
  }
  const jobsData: Record<string, { min: number, max: number }> = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));
  const curJob = jobData.job;
  const jobInfo = jobsData[curJob];
  if (!jobInfo) {
    return interaction.reply({ content: '你的職業資料異常，請重新選擇職業。', flags: MessageFlags.Ephemeral });
  }

  // 隨機工資
  const pay = Math.floor(Math.random() * (jobInfo.max - jobInfo.min + 1)) + jobInfo.min;

  // 經濟 balance
  const userEco = getUserEconomy(guildId, userId);
  userEco.balance += pay;
  setUserEconomy(guildId, userId, userEco);

  // 壓力
  jobData.stress = (jobData.stress ?? 0) + 10;
  setUserJobData(guildId, userId, jobData);

  // 設定冷卻
  setCooldown(guildId, userId, now);

  // 回覆
  await interaction.reply({
    content: `你認真工作了一番，獲得了 ${pay} 金幣 💰\n目前餘額：${userEco.balance}\n壓力值 +10（目前壓力：${jobData.stress}）`,
    flags: MessageFlags.Ephemeral
  });
}
