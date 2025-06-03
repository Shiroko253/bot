import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('回覆 Pong!');

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply('🏓 Pong!');
}
