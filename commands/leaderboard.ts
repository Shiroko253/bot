import {
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
  CacheType,
} from "discord.js";
import * as fs from "fs";
import * as path from "path";

// JSON 檔路徑
const USER_JOBS_PATH = path.join(__dirname, "..", "config", "user-jobs.json");

// 讀寫工具
function loadJson(pathStr: string): any {
  if (!fs.existsSync(pathStr)) return {};
  return JSON.parse(fs.readFileSync(pathStr, "utf8"));
}
function saveJson(pathStr: string, data: any): void {
  fs.writeFileSync(pathStr, JSON.stringify(data, null, 2), "utf8");
}

export const data = new SlashCommandBuilder()
  .setName("reset_job")
  .setDescription("重置職業");

export async function execute(interaction: CommandInteraction<CacheType>) {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;
  if (!guildId) {
    await interaction.reply({
      content: "僅限伺服器內使用",
    });
    return;
  }

  const userJobs = loadJson(USER_JOBS_PATH);
  const groupData = userJobs[guildId] ?? {};
  const userInfo = groupData[userId] ?? {};
  const currentJob = userInfo.job ?? "無職業";

  const embed = new EmbedBuilder()
    .setTitle("職業重置確認")
    .setDescription(`你當前的職業是：\`${currentJob}\`\n\n確定要放棄現有職業嗎？`)
    .setColor(0xFFA500)
    .setFooter({ text: "請選擇 Yes 或 No" });

  const yesBtn = new ButtonBuilder()
    .setCustomId("reset_job_yes")
    .setLabel("Yes")
    .setStyle(ButtonStyle.Success);
  const noBtn = new ButtonBuilder()
    .setCustomId("reset_job_no")
    .setLabel("No")
    .setStyle(ButtonStyle.Danger);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(yesBtn, noBtn);

  // 完全移除 fetchReply, ephemeral, flags，直接公開
  const msg = await interaction.reply({
    embeds: [embed],
    components: [row],
  }).then(() => interaction.fetchReply());

  // 收集互動
  const collector = (msg as any).createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 15_000,
  });

  collector.on("collect", async (btnInt: any) => {
    if (btnInt.user.id !== userId) {
      await btnInt.reply({
        content: "這不是你的選擇！",
        ephemeral: true, // 這個可以保留，只有這樣「非本人」才不會洗頻道
      });
      return;
    }

    if (btnInt.customId === "reset_job_yes") {
      // 清除 user-jobs.json 的 job 欄位
      const jobs = loadJson(USER_JOBS_PATH);
      if (jobs[guildId] && jobs[guildId][userId]) {
        jobs[guildId][userId].job = null;
        saveJson(USER_JOBS_PATH, jobs);
      }
      const successEmbed = new EmbedBuilder()
        .setTitle("成功")
        .setDescription("你的職業已被清除！")
        .setColor(0x00FF00);
      await btnInt.update({ embeds: [successEmbed], components: [] });
      collector.stop();
    }
    if (btnInt.customId === "reset_job_no") {
      const cancelEmbed = new EmbedBuilder()
        .setTitle("操作取消")
        .setDescription("你的職業未被清除。")
        .setColor(0xFF0000);
      await btnInt.update({ embeds: [cancelEmbed], components: [] });
      collector.stop();
    }
  });

  collector.on("end", async () => {
    try {
      await (msg as any).edit({ components: [] });
    } catch {}
  });
}
