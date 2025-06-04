import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

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
  // 權限檢查
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
  const minutes = interaction.options.getInteger('minutes', true);
  const reason = interaction.options.getString('reason') ?? '無';

  // 時間區間檢查
  if (minutes < 1 || minutes > 40320) { // 28天=40320分鐘
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xffc300)
          .setTitle('時間錯誤')
          .setDescription('禁言時間必須在 1 ~ 40320 分鐘之間。')
      ],
      ephemeral: true
    });
  }

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

  // 無法禁言
  if (!member.moderatable) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xffc300)
          .setTitle('無法禁言')
          .setDescription('我無法禁言這位用戶（可能因為我的權限層級不足或對方是管理員）。')
      ],
      ephemeral: true
    });
  }

  // 禁言動作
  try {
    await member.timeout(minutes * 60 * 1000, reason);

    const now = new Date();
    const embed = new EmbedBuilder()
      .setTitle('⏳ 用戶已被禁言')
      .setColor(0xffc300)
      .addFields(
        { name: '用戶', value: `${target.tag} (<@${target.id}>)`, inline: false },
        { name: '用戶ID', value: target.id, inline: true },
        { name: '原因', value: reason, inline: false },
        { name: '時長', value: `${minutes} 分鐘`, inline: true },
        { name: '時間', value: now.toLocaleString('zh-TW', { hour12: false, timeZone: 'Asia/Taipei' }), inline: true }
      )
      .setFooter({ text: `操作管理員: ${interaction.user.tag}` });

    return interaction.reply({ embeds: [embed] }); // 公開顯示
  } catch (err) {
    // 若封鎖失敗
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff6961)
          .setTitle('禁言失敗')
          .setDescription('執行禁言動作時發生錯誤，請稍後重試。')
      ],
      ephemeral: true
    });
  }
}
