import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('unban')
  .setDescription('解除封禁（僅限管理員）')
  .addStringOption(option =>
    option.setName('userid').setDescription('要解封的用戶ID').setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: '你不是管理員，不能使用本指令。', ephemeral: true });
  }
  const userId = interaction.options.getString('userid', true);

  try {
    await interaction.guild?.members.unban(userId);
    return interaction.reply({ content: `已解除對 <@${userId}> 的封禁。` });
  } catch (error) {
    return interaction.reply({ content: '無法解除封禁，請確認用戶ID正確。', ephemeral: true });
  }
}
