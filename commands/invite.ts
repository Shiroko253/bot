import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';

const CLIENT_ID = process.env.CLIENT_ID || '你的BOT_CLIENT_ID'; // 建議用環境變數
const PERMISSIONS = '8'; // 可根據需求調整

export const data = new SlashCommandBuilder()
  .setName('invite')
  .setDescription('生成這個機器人的邀請鏈接');

export async function execute(interaction: ChatInputCommandInteraction) {
  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=bot&permissions=${PERMISSIONS}`;
  const embed = new EmbedBuilder()
    .setTitle('邀請機器人到你的伺服器')
    .setDescription(`[點我邀請機器人](${inviteUrl})`)
    .setColor(0x5865f2)
    .setFooter({ text: '感謝你的支持！' });
  await interaction.reply({ embeds: [embed] });
}
