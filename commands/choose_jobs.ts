import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, ComponentType, MessageFlags } from 'discord.js';
import fs from 'fs';
import path from 'path';

// 經濟資料夾
const economyDir = path.join(__dirname, '..', 'economys');
if (!fs.existsSync(economyDir)) fs.mkdirSync(economyDir);

// config/jobs.json 路徑
const jobsPath = path.join(__dirname, '..', 'config', 'jobs.json');
// config/user-jobs.json 路徑
const userJobsPath = path.join(__dirname, '..', 'config', 'user-jobs.json');

// 讀取職業資料
const jobsData: Record<string, {min: number, max: number}> = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));

/**
 * 取得經濟資料檔案路徑
 */
function getEconomyFileName(guildId: string, userId: string) {
  return path.join(economyDir, `${guildId}_${userId}.json`);
}

/**
 * 讀取用戶經濟資料
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
 * 寫入用戶經濟資料
 */
function setUserEconomy(guildId: string, userId: string, data: any) {
  const filePath = getEconomyFileName(guildId, userId);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * 讀取所有用戶職業資料(user-jobs.json)
 */
function getAllUserJobs(): Record<string, Record<string, string>> {
  if (!fs.existsSync(userJobsPath)) {
    fs.writeFileSync(userJobsPath, JSON.stringify({}, null, 2));
    return {};
  }
  return JSON.parse(fs.readFileSync(userJobsPath, 'utf8'));
}

/**
 * 設置某用戶的職業到 user-jobs.json
 */
function setUserJob(guildId: string, userId: string, job: string) {
  const allJobs = getAllUserJobs();
  if (!allJobs[guildId]) allJobs[guildId] = {};
  allJobs[guildId][userId] = job;
  fs.writeFileSync(userJobsPath, JSON.stringify(allJobs, null, 2));
}

/**
 * 統計某職業在群組內被選擇的人數（從 user-jobs.json 統計）
 */
function countJobUsers(guildId: string, job: string): number {
  const allJobs = getAllUserJobs();
  if (!allJobs[guildId]) return 0;
  return Object.values(allJobs[guildId]).filter(j => j === job).length;
}

export const data = new SlashCommandBuilder()
  .setName('choose_jobs')
  .setDescription('選擇你的職業（部分職業有限制）');

/**
 * /choose_jobs 指令主體
 */
export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;
  if (!guildId) {
    return interaction.reply({
      content: '只能在伺服器中執行本指令。',
      flags: MessageFlags.Ephemeral
    });
  }

  // 動態產生職業清單，賭徒不可選，IT程序員限制最多 5 人
  const options = Object.entries(jobsData)
    .filter(([name]) => name !== '賭徒')
    .map(([name]) => {
      if (name === 'IT程序員' && countJobUsers(guildId, name) >= 5) {
        return { label: `${name}（已滿）`, value: name, description: '此職業已達上限', default: false, disabled: true };
      }
      return { label: name, value: name, default: false };
    });

  // 建立選擇菜單
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('choose_job_menu')
    .setPlaceholder('請選擇你的職業')
    .addOptions(
      options.map(opt => ({
        label: opt.label,
        value: opt.value,
        description: opt.description,
        default: opt.default,
        disabled: opt.disabled ?? false
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  // 發送互動消息
  const msg = await interaction.reply({
    content: '請選擇你要的職業：',
    components: [row],
    flags: MessageFlags.Ephemeral
  });

  // 等待用戶選擇
  try {
    const selectInteraction = await interaction.channel?.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      time: 15000,
      filter: (i) => i.user.id === userId && i.customId === 'choose_job_menu'
    }) as StringSelectMenuInteraction;

    const job = selectInteraction.values[0];
    if (job === 'IT程序員' && countJobUsers(guildId, job) >= 5) {
      return selectInteraction.reply({
        content: '此職業已達上限，請選擇其他職業。',
        flags: MessageFlags.Ephemeral
      });
    }

    // 設定職業（同時記錄到 user-jobs.json）
    const eco = getUserEconomy(guildId, userId);
    eco.job = job;
    setUserEconomy(guildId, userId, eco);
    setUserJob(guildId, userId, job); // <--- 新增這行，user-jobs.json 記錄

    await selectInteraction.update({
      content: `你已選擇職業：${job}`,
      components: []
    });
  } catch (err) {
    // 修正：用 msg.edit 而不是 interaction.editReply
    await msg.edit({ content: '你沒有在時間內選擇職業，請重新執行指令。', components: [] });
  }
}
