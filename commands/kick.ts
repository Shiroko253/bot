import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('踢出用戶（僅限管理員）')
  .addUserOption(option =>
    option.setName('target').setDescription('要踢出的用戶').setRequired(true)
  )
  .addStringOption(option =>
    option.setName('reason').setDescription('踢出原因').setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: '你不是管理員，不能使用本指令。', ephemeral: true });
  }
  const target = interaction.options.getUser('target', true);
  const reason = interaction.options.getString('reason') ?? '無';
  const member = await interaction.guild?.members.fetch(target.id).catch(() => null);

  if (!member) {
    return interaction.reply({ content: '找不到這位用戶。', ephemeral: true });
  }
  if (!member.kickable) {
    return interaction.reply({ content: '我無法踢出這位用戶（可能管理權限層級不足）。', ephemeral: true });
  }
  await member.kick(reason);
  return interaction.reply({ content: `已踢出 <@${target.id}>，原因：${reason}` });
}
