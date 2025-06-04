import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

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
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff6961)
          .setTitle('權限不足')
          .setDescription('你不是管理員，不能使用本指令。')
      ],
      ephemeral: true
    });
  }

  const target = interaction.options.getUser('target', true);
  const reason = interaction.options.getString('reason') ?? '無';
  const member = await interaction.guild?.members.fetch(target.id).catch(() => null);

  if (!member) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xffc300)
          .setTitle('找不到用戶')
          .setDescription(`找不到這位用戶（ID: ${target.id}）。`)
      ],
      ephemeral: true
    });
  }

  if (!member.bannable) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xffc300)
          .setTitle('無法封禁')
          .setDescription('我無法封禁這位用戶（可能因為我的權限層級不足或對方是管理員）。')
      ],
      ephemeral: true
    });
  }

  await member.ban({ reason });

  const now = new Date();
  const embed = new EmbedBuilder()
    .setTitle('🔨 用戶已封禁')
    .setColor(0xff6961)
    .addFields(
      { name: '用戶', value: `${target.tag} (<@${target.id}>)`, inline: false },
      { name: '用戶ID', value: target.id, inline: true },
      { name: '原因', value: reason, inline: false },
      { name: '時間', value: now.toLocaleString('zh-TW', { hour12: false, timeZone: 'Asia/Taipei' }), inline: true }
    )
    .setFooter({ text: `操作管理員: ${interaction.user.tag}` });

  return interaction.reply({ embeds: [embed] }); // 公開顯示
}
