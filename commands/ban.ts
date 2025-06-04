import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('封禁用戶（僅限管理員）')
  .addUserOption(option =>
    option.setName('target').setDescription('要封禁的用戶').setRequired(true)
  )
  .addStringOption(option =>
    option.setName('reason').setDescription('封禁原因').setRequired(false)
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
  if (!member.bannable) {
    return interaction.reply({ content: '我無法封禁這位用戶（可能管理權限層級不足）。', ephemeral: true });
  }
  await member.ban({ reason });
  return interaction.reply({ content: `已封禁 <@${target.id}>，原因：${reason}` });
}
