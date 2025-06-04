import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('timeout')
  .setDescription('禁言用戶（僅限管理員）')
  .addUserOption(option =>
    option.setName('target').setDescription('要禁言的用戶').setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('minutes').setDescription('禁言分鐘數（最長28天）').setRequired(true)
  )
  .addStringOption(option =>
    option.setName('reason').setDescription('禁言原因').setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: '你不是管理員，不能使用本指令。', ephemeral: true });
  }
  const target = interaction.options.getUser('target', true);
  const minutes = interaction.options.getInteger('minutes', true);
  const reason = interaction.options.getString('reason') ?? '無';

  if (minutes < 1 || minutes > 40320) { // 28天=40320分鐘
    return interaction.reply({ content: '禁言時間必須在 1 ~ 40320 分鐘之間。', ephemeral: true });
  }
  const member = await interaction.guild?.members.fetch(target.id).catch(() => null);

  if (!member) {
    return interaction.reply({ content: '找不到這位用戶。', ephemeral: true });
  }
  if (!member.moderatable) {
    return interaction.reply({ content: '我無法禁言這位用戶（可能管理權限層級不足）。', ephemeral: true });
  }
  await member.timeout(minutes * 60 * 1000, reason);
  return interaction.reply({ content: `已禁言 <@${target.id}> ${minutes} 分鐘，原因：${reason}` });
}
