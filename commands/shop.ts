import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ButtonInteraction,
  StringSelectMenuInteraction,
  Message,
  MessageComponentInteraction,
  MessageActionRowComponentBuilder,
} from 'discord.js';
import fs from 'fs';
import path from 'path';

type ShopItem = {
  name: string;
  price: number;
  tax: number;
  stress: number;
};

const shopPath = path.join(__dirname, '..', 'config', 'shop.json');
const userBackpackPath = path.join(__dirname, '..', 'config', 'user-backpack.json');

function loadShopData(): ShopItem[] {
  if (!fs.existsSync(shopPath)) return [];
  const data = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
  return Array.isArray(data) ? data : (data.shop_item as ShopItem[]);
}

function loadUserBackpack(): Record<string, any> {
  if (!fs.existsSync(userBackpackPath)) return {};
  return JSON.parse(fs.readFileSync(userBackpackPath, 'utf8'));
}

function saveUserBackpack(data: any): void {
  fs.writeFileSync(userBackpackPath, JSON.stringify(data, null, 2));
}

// 每個伺服器的經濟以 economys/guildId.json 儲存
function loadBalance(guildId: string, userId: string): number {
  const economysDir = path.join(__dirname, '..', 'economys');
  if (!fs.existsSync(economysDir)) fs.mkdirSync(economysDir, { recursive: true });

  const balancePath = path.join(economysDir, `${guildId}.json`);
  if (!fs.existsSync(balancePath)) return 0;
  const all = JSON.parse(fs.readFileSync(balancePath, 'utf8'));
  return all?.[userId] ?? 0;
}

function saveBalance(guildId: string, userId: string, newBalance: number): void {
  const economysDir = path.join(__dirname, '..', 'economys');
  if (!fs.existsSync(economysDir)) fs.mkdirSync(economysDir, { recursive: true });

  const balancePath = path.join(economysDir, `${guildId}.json`);
  let all: any = {};
  if (fs.existsSync(balancePath)) all = JSON.parse(fs.readFileSync(balancePath, 'utf8'));
  all[userId] = newBalance;
  fs.writeFileSync(balancePath, JSON.stringify(all, null, 2));
}

export const data = new SlashCommandBuilder()
  .setName('shop')
  .setDescription('🌸 來逛逛幽幽子的夢幻商店吧～');

export async function execute(interaction: ChatInputCommandInteraction) {
  const shopData = loadShopData();
  if (!shopData || shopData.length === 0) {
    await interaction.reply({ content: '商店數據載入失敗了呢～請使用 `/feedback` 回報喔！', ephemeral: true });
    return;
  }

  const ITEMS_PER_PAGE = 25;
  const totalPages = Math.ceil(shopData.length / ITEMS_PER_PAGE);

  let currentPage = 0;
  const userId = interaction.user.id;
  const guildId = interaction.guildId!;
  let message: Message | undefined;

  async function sendShopPage(page: number) {
    const start = page * ITEMS_PER_PAGE;
    const end = Math.min(start + ITEMS_PER_PAGE, shopData.length);

    const embed = new EmbedBuilder()
      .setTitle(`🌸 商店 - 第 ${page + 1}/${totalPages} 頁`)
      .setDescription('選擇想購買的商品吧～✨')
      .setColor(0xFFB6C1);

    const options = shopData.slice(start, end).map((item: ShopItem) => ({
      label: item.name,
      description: `價格: ${item.price} + 稅: ${item.tax}, 壓力: ${item.stress}`,
      value: item.name,
    }));

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('shop_select')
        .setPlaceholder('✨ 請選擇想要購買的商品～')
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(options)
    );

    const navRow = new ActionRowBuilder<ButtonBuilder>();
    if (page > 0) {
      navRow.addComponents(
        new ButtonBuilder().setCustomId('shop_prev').setLabel('⬅️ 上一頁').setStyle(ButtonStyle.Primary)
      );
    }
    if (page < totalPages - 1) {
      navRow.addComponents(
        new ButtonBuilder().setCustomId('shop_next').setLabel('➡️ 下一頁').setStyle(ButtonStyle.Primary)
      );
    }

    if (!message) {
      message = (await interaction.reply({
        embeds: [embed],
        components: navRow.components.length > 0 ? [row, navRow] : [row],
        fetchReply: true,
      })) as Message;
    } else {
      await interaction.editReply({
        embeds: [embed],
        components: navRow.components.length > 0 ? [row, navRow] : [row],
      });
    }
  }

  await sendShopPage(currentPage);

  const collector = (message as Message).createMessageComponentCollector({
    filter: (i: MessageComponentInteraction) =>
      i.user.id === userId && (i.isButton() || i.isStringSelectMenu()),
    time: 60_000,
  });

  collector.on('collect', async (i: MessageComponentInteraction) => {
    if (i.isButton()) {
      if (i.customId === 'shop_prev') {
        currentPage = Math.max(0, currentPage - 1);
        await sendShopPage(currentPage);
        await i.deferUpdate();
      } else if (i.customId === 'shop_next') {
        currentPage = Math.min(totalPages - 1, currentPage + 1);
        await sendShopPage(currentPage);
        await i.deferUpdate();
      }
    } else if (i.isStringSelectMenu() && i.customId === 'shop_select') {
      const selectedName = i.values[0];
      const item = shopData.find((it: ShopItem) => it.name === selectedName);
      if (!item) return;

      const totalPrice = item.price + item.tax;
      const balance = loadBalance(guildId, userId);

      const embed = new EmbedBuilder()
        .setTitle('🌸 購買確認')
        .setDescription(
          `您選擇了 **${selectedName}**～\n` +
          `價格：${item.price} 幽靈幣\n` +
          `稅金：${item.tax} 幽靈幣\n` +
          `壓力：${item.stress}\n` +
          `總價格：**${totalPrice}** 幽靈幣`
        )
        .setColor(0xFFB6C1);

      const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('shop_confirm').setLabel('✅ 確認購買').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('shop_cancel').setLabel('❌ 取消').setStyle(ButtonStyle.Danger)
      );

      await i.update({ embeds: [embed], components: [confirmRow] });

      const confCollector = (message as Message).createMessageComponentCollector({
        filter: (n: ButtonInteraction) => n.user.id === userId,
        time: 30_000,
        max: 1,
        componentType: ComponentType.Button,
      });

      confCollector.on('collect', async (n: ButtonInteraction) => {
        if (n.customId === 'shop_cancel') {
          await n.update({ content: '已取消購買呢～♪', embeds: [], components: [] });
          return;
        }
        if (n.customId === 'shop_confirm') {
          if (balance < totalPrice) {
            await n.update({ content: '幽靈幣不足呢～要不要再努力賺一點？💸', embeds: [], components: [] });
            return;
          }
          saveBalance(guildId, userId, balance - totalPrice);

          const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('store_backpack').setLabel('🎒 存入背包').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('store_use').setLabel('🍽️ 直接食用').setStyle(ButtonStyle.Secondary)
          );

          const handle = async (
            type: 'backpack' | 'use',
            btnInt: ButtonInteraction
          ) => {
            const userBackpack = loadUserBackpack();
            if (!userBackpack[guildId]) userBackpack[guildId] = {};
            if (!userBackpack[guildId][userId])
              userBackpack[guildId][userId] = { stress: 200, backpack: [] };

            if (type === 'backpack') {
              userBackpack[guildId][userId].backpack.push({
                name: item.name,
                price: item.price,
                tax: item.tax,
                stress: item.stress,
              });
              saveUserBackpack(userBackpack);
              await btnInt.update({ content: `✨ **${item.name}** 已存入背包！`, embeds: [], components: [] });
            } else {
              userBackpack[guildId][userId].stress = Math.max(
                0,
                (userBackpack[guildId][userId].stress ?? 200) - item.stress
              );
              saveUserBackpack(userBackpack);
              await btnInt.update({
                content: `🍽️ 你食用了 **${item.name}**，壓力下降了 ${item.stress} 點！`,
                embeds: [],
                components: [],
              });
            }
          };

          await n.update({
            embeds: [
              new EmbedBuilder()
                .setTitle('🌸 商品處理')
                .setDescription(`您購買了 **${item.name}**！\n請選擇：存入背包還是直接食用？`)
                .setColor(0xFFB6C1),
            ],
            components: [actionRow],
          });

          const storeCollector = (message as Message).createMessageComponentCollector({
            filter: (btnInt: ButtonInteraction) => btnInt.user.id === userId,
            max: 1,
            time: 30_000,
            componentType: ComponentType.Button,
          });

          storeCollector.on('collect', async (btnInt: ButtonInteraction) => {
            if (btnInt.customId === 'store_backpack') await handle('backpack', btnInt);
            if (btnInt.customId === 'store_use') await handle('use', btnInt);
          });
        }
      });
    }
  });

  collector.on('end', async () => {
    if (message && message.editable) {
      // 超時後直接移除所有 UI
      await message.edit({
        content: '商店已超時，請重新開啟！',
        embeds: [],
        components: [],
      });
    }
  });
}
