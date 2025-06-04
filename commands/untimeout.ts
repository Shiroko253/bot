import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('untimeout')
  .setDescription('解除禁言（需要管理員權限）')
  .addUserOption(option =>
    option.setName('target').setDescription('要解除禁言的用戶').setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  // 權限檢查
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff6961)
          .setTitle('權限不足')
          .setDescription('你沒有權限解除禁言。')
      ],
      ephemeral: true
    });
  }

  const target = interaction.options.getUser('target', true);
  const member = await interaction.guild?.members.fetch(target.id).catch(() => null);

  // 找不到用戶
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

  // 檢查是否可操作
  if (!member.moderatable) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xffc300)
          .setTitle('無法解除禁言')
          .setDescription('我無法解除禁言（可能因為我的權限層級不足或對方是管理員）。')
      ],
      ephemeral: true
    });
  }

  // 檢查是否真的被禁言過
  if (
    !member.communicationDisabledUntil ||
    !member.communicationDisabledUntilTimestamp ||
    member.communicationDisabledUntilTimestamp < Date.now()
  ) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xffc300)
          .setTitle('未處於禁言狀態')
          .setDescription(`該用戶目前未被禁言。`)
      ],
      ephemeral: true
    });
  }

  // 解除禁言
  try {
    await member.timeout(null);

    const now = new Date();
    const embed = new EmbedBuilder()
      .setTitle('🔊 用戶已解除禁言')
      .setColor(0x7ed957)
      .addFields(
        { name: '用戶', value: `${target.tag} (<@${target.id}>)`, inline: false },
        { name: '用戶ID', value: target.id, inline: true },
        { name: '解除時間', value: now.toLocaleString('zh-TW', { hour12: false, timeZone: 'Asia/Taipei' }), inline: true }
      )
      .setFooter({ text: `操作管理員: ${interaction.user.tag}` });

    return interaction.reply({ embeds: [embed] }); // 公開顯示
  } catch (err) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff6961)
          .setTitle('解除禁言失敗')
          .setDescription('執行解除禁言時發生錯誤，請稍後重試。')
      ],
      ephemeral: true
    });
  }
}
