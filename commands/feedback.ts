import {
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
  CacheType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import fetch from "node-fetch"; // npm i node-fetch@2
import * as dotenv from "dotenv";
dotenv.config();

const FEEDBACK_WEBHOOK = process.env.FEEDBACK;

export const data = new SlashCommandBuilder()
  .setName("feedback")
  .setDescription("提供回饋或回報問題");

async function sendFeedbackToWebhook(type: string, userTag: string, userId: string, desc: string) {
  if (!FEEDBACK_WEBHOOK) return;
  const payload = {
    username: "Feedback Bot",
    embeds: [
      {
        title: "新的意見回饋",
        color: 0x3498db,
        fields: [
          { name: "類型", value: type, inline: false },
          { name: "用戶", value: `${userTag} (<@${userId}>)`, inline: false },
          { name: "描述", value: desc, inline: false },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };
  await fetch(FEEDBACK_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function execute(interaction: CommandInteraction<CacheType>) {
  const userId = interaction.user.id;
  const userTag = interaction.user.tag;

  const embed = new EmbedBuilder()
    .setTitle("意見回饋")
    .setDescription("請選擇你遇到的問題類型：")
    .setColor(0x3498db);

  const btn1 = new ButtonBuilder()
    .setCustomId("fb_gamble")
    .setLabel("賭博系統錯誤")
    .setStyle(ButtonStyle.Primary);
  const btn2 = new ButtonBuilder()
    .setCustomId("fb_cmd")
    .setLabel("指令出現未回應")
    .setStyle(ButtonStyle.Primary);
  const btn3 = new ButtonBuilder()
    .setCustomId("fb_msg")
    .setLabel("bot訊息系統出現問題")
    .setStyle(ButtonStyle.Primary);
  const btn4 = new ButtonBuilder()
    .setCustomId("fb_other")
    .setLabel("其他問題")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btn1, btn2, btn3, btn4);

  const msg = await interaction.reply({
    embeds: [embed],
    components: [row],
  }).then(() => interaction.fetchReply());

  const collector = (msg as any).createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 30_000,
  });

  collector.on("collect", async (btnInt: any) => {
    if (btnInt.user.id !== userId) {
      await btnInt.reply({
        content: "這不是你的回饋！",
        ephemeral: true,
      });
      return;
    }

    // 賭博系統錯誤細分
    if (btnInt.customId === "fb_gamble") {
      const gamble1 = new ButtonBuilder()
        .setCustomId("fb_gamble_money")
        .setLabel("金錢顯示異常")
        .setStyle(ButtonStyle.Secondary);
      const gamble2 = new ButtonBuilder()
        .setCustomId("fb_gamble_noresult")
        .setLabel("賭博沒結果")
        .setStyle(ButtonStyle.Secondary);
      const gamble3 = new ButtonBuilder()
        .setCustomId("fb_gamble_other")
        .setLabel("其他賭博相關")
        .setStyle(ButtonStyle.Secondary);

      const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(gamble1, gamble2, gamble3);

      await btnInt.update({
        embeds: [
          new EmbedBuilder()
            .setTitle("賭博系統錯誤")
            .setDescription("請選擇細分類型，或提供具體說明"),
        ],
        components: [row2],
      });

      const subCollector = (msg as any).createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30_000,
      });

      subCollector.on("collect", async (subBtnInt: any) => {
        if (subBtnInt.user.id !== userId) {
          await subBtnInt.reply({
            content: "這不是你的回饋！",
            ephemeral: true,
          });
          return;
        }
        let reason = "";
        if (subBtnInt.customId === "fb_gamble_money") reason = "賭博金錢顯示異常";
        else if (subBtnInt.customId === "fb_gamble_noresult") reason = "賭博沒結果";
        else reason = "其他賭博相關";

        const modal = new ModalBuilder()
          .setCustomId("fb_modal_gamble")
          .setTitle("問題詳情")
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId("desc")
                .setLabel("請描述遇到的問題")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
            )
          );
        await subBtnInt.showModal(modal);

        const modalInt = await subBtnInt.awaitModalSubmit({ time: 60_000 }).catch(() => null);
        if (modalInt) {
          const userDesc = modalInt.fields.getTextInputValue("desc");
          await modalInt.reply({
            content: `已收到你的回報：\n**${reason}**\n${userDesc}`,
          });
          await sendFeedbackToWebhook(reason, userTag, userId, userDesc);
        }
        subCollector.stop();
        collector.stop();
      });
    }

    // 指令未回應
    if (btnInt.customId === "fb_cmd") {
      const cmd1 = new ButtonBuilder()
        .setCustomId("fb_cmd_timeout")
        .setLabel("指令超時")
        .setStyle(ButtonStyle.Secondary);
      const cmd2 = new ButtonBuilder()
        .setCustomId("fb_cmd_noreply")
        .setLabel("完全沒回應")
        .setStyle(ButtonStyle.Secondary);
      const cmd3 = new ButtonBuilder()
        .setCustomId("fb_cmd_other")
        .setLabel("其他指令相關")
        .setStyle(ButtonStyle.Secondary);

      const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(cmd1, cmd2, cmd3);

      await btnInt.update({
        embeds: [
          new EmbedBuilder()
            .setTitle("指令出現未回應")
            .setDescription("請選擇細分類型，或提供具體說明"),
        ],
        components: [row2],
      });

      const subCollector = (msg as any).createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30_000,
      });

      subCollector.on("collect", async (subBtnInt: any) => {
        if (subBtnInt.user.id !== userId) {
          await subBtnInt.reply({
            content: "這不是你的回饋！",
            ephemeral: true,
          });
          return;
        }
        let reason = "";
        if (subBtnInt.customId === "fb_cmd_timeout") reason = "指令超時";
        else if (subBtnInt.customId === "fb_cmd_noreply") reason = "完全沒回應";
        else reason = "其他指令相關";

        const modal = new ModalBuilder()
          .setCustomId("fb_modal_cmd")
          .setTitle("問題詳情")
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId("desc")
                .setLabel("請描述遇到的問題")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
            )
          );
        await subBtnInt.showModal(modal);

        const modalInt = await subBtnInt.awaitModalSubmit({ time: 60_000 }).catch(() => null);
        if (modalInt) {
          const userDesc = modalInt.fields.getTextInputValue("desc");
          await modalInt.reply({
            content: `已收到你的回報：\n**${reason}**\n${userDesc}`,
          });
          await sendFeedbackToWebhook(reason, userTag, userId, userDesc);
        }
        subCollector.stop();
        collector.stop();
      });
    }

    // bot訊息系統出現問題
    if (btnInt.customId === "fb_msg") {
      const reason = "bot訊息系統出現問題";
      const modal = new ModalBuilder()
        .setCustomId("fb_modal_msg")
        .setTitle("問題詳情")
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId("desc")
              .setLabel("請描述遇到的問題")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
          )
        );
      await btnInt.showModal(modal);

      const modalInt = await btnInt.awaitModalSubmit({ time: 60_000 }).catch(() => null);
      if (modalInt) {
        const userDesc = modalInt.fields.getTextInputValue("desc");
        await modalInt.reply({
          content: `已收到你的回報：\n**${reason}**\n${userDesc}`,
        });
        await sendFeedbackToWebhook(reason, userTag, userId, userDesc);
      }
      collector.stop();
    }

    // 其他問題
    if (btnInt.customId === "fb_other") {
      const reason = "其他問題";
      const modal = new ModalBuilder()
        .setCustomId("fb_modal_other")
        .setTitle("問題詳情")
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId("desc")
              .setLabel("請描述遇到的問題")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
          )
        );
      await btnInt.showModal(modal);

      const modalInt = await btnInt.awaitModalSubmit({ time: 60_000 }).catch(() => null);
      if (modalInt) {
        const userDesc = modalInt.fields.getTextInputValue("desc");
        await modalInt.reply({
          content: `已收到你的回報：\n**${reason}**\n${userDesc}`,
        });
        await sendFeedbackToWebhook(reason, userTag, userId, userDesc);
      }
      collector.stop();
    }
  });

  collector.on("end", async () => {
    try {
      await (msg as any).edit({ components: [] });
    } catch {}
  });
}
