import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('回覆 Pong! 並顯示延遲資訊');

export async function execute(interaction: ChatInputCommandInteraction) {
  // 先回覆一個延遲中的訊息以取得 API 延遲
  const sent = await interaction.reply({ content: '🏓 Pong!', fetchReply: true });

  // 取得 Discord API 和伺服器延遲
  const apiLatency = interaction.client.ws.ping;
  // 與訊息建立的延遲
  const serverLatency = sent.createdTimestamp - interaction.createdTimestamp;

  // 建立嵌入訊息
  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setTitle('🏓 Pong!')
    .addFields(
      { name: 'Discord API 延遲', value: `${apiLatency} ms`, inline: true },
      { name: '伺服器回應延遲', value: `${serverLatency} ms`, inline: true }
    )
    .setTimestamp();

  // 編輯原先的回覆為嵌入訊息
  await interaction.editReply({ content: '', embeds: [embed] });
}
