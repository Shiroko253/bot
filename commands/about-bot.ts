import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('about-bot')
  .setDescription('ℹ️ 關於這個機器人');

export async function execute(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setTitle('👻 關於 Yuyuko_bot-y2')
    .setColor(0xB4A7D6)
    .setDescription([
      'Yuyuko_bot-y2 是一個多功能 Discord 機器人，提供管理、娛樂、自動化等多種功能，致力於提升伺服器互動體驗。',
      '',
      '———',
      '🛠️ **開發語言**：TypeScript + JavaScript',
      '📦 **主要庫**：discord.js',
      '🖥️ **運行環境**：Node.js',
      '🔧 **進程管理**：PM2',
      '',
      '開源授權（GNU GPL v3.0） | 由 Shiroko 製作與維護'
    ].join('\n'))
    .setFooter({ text: '如有問題歡迎回報或參考 README.md！' });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
