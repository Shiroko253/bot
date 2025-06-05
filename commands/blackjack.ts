import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
} from 'discord.js';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import fs from 'fs';

// 資料檔案路徑
const CONFIG_DIR = path.resolve('config');
const ECONOMY_DIR = path.resolve('economys');
const BALANCE_PATH = path.join(ECONOMY_DIR, 'balance.json');
const BLACKJACK_PATH = path.join(CONFIG_DIR, 'blackjack_data.json');
const INVALID_BET_PATH = path.join(CONFIG_DIR, 'invalid_bet_count.json');
const USER_JOBS_PATH = path.join(CONFIG_DIR, 'user-jobs.json');

// 型別定義
interface BalanceData {
  [guildId: string]: { [userId: string]: number };
}
interface InvalidBetData {
  [guildId: string]: { [userId: string]: number };
}
interface BlackjackData {
  [guildId: string]: {
    [userId: string]: {
      playerCards: (number | string)[];
      dealerCards: (number | string)[];
      deck: (number | string)[];
      bet: number;
      gameStatus: 'ongoing' | 'ended';
      doubleDownUsed: boolean;
      isGambler: boolean;
    };
  };
}
interface UserJobsData {
  [guildId: string]: { [userId: string]: { job: string } };
}

// 工具函數
async function ensureDir(dir: string): Promise<void> {
  if (!fs.existsSync(dir)) await mkdir(dir, { recursive: true });
}

async function loadJson<T>(file: string): Promise<T> {
  try {
    await ensureDir(path.dirname(file));
    const raw = await readFile(file, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`讀取 JSON 檔案 ${file} 時發生錯誤：`, error);
    return {} as T;
  }
}

async function saveJson<T>(file: string, data: T): Promise<void> {
  try {
    await ensureDir(path.dirname(file));
    await writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`寫入 JSON 檔案 ${file} 時發生錯誤：`, error);
    throw error;
  }
}

function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function createDeck(): (number | string)[] {
  return [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'].flatMap(card => Array(4).fill(card));
}

function calculateHand(cards: (number | string)[]): number {
  let value = 0, aces = 0;
  for (const card of cards) {
    if (['J', 'Q', 'K'].includes(String(card))) value += 10;
    else if (card === 'A') { aces++; value += 11; }
    else value += Number(card);
  }
  while (value > 21 && aces) { value -= 10; aces--; }
  return value;
}

export const data = new SlashCommandBuilder()
  .setName('blackjack')
  .setDescription('與幽幽子共舞一場21點遊戲～')
  .addNumberOption(opt => opt.setName('bet').setDescription('下注金額').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle('🌸 錯誤 🌸')
        .setDescription('此指令僅能在伺服器中使用哦～')
        .setColor('Red')],
      ephemeral: true,
    });
    return;
  }

  const bet = roundToTwoDecimals(interaction.options.getNumber('bet', true));
  const userId = interaction.user.id;
  const guildId = interaction.guildId;

  // 載入資料
  const [balance, invalidBet, blackjackData, userJobs] = await Promise.all([
    loadJson<BalanceData>(BALANCE_PATH),
    loadJson<InvalidBetData>(INVALID_BET_PATH),
    loadJson<BlackjackData>(BLACKJACK_PATH),
    loadJson<UserJobsData>(USER_JOBS_PATH),
  ]);

  // 賭注驗證
  if (bet <= 0) {
    invalidBet[guildId] ??= {};
    invalidBet[guildId][userId] = (invalidBet[guildId][userId] ?? 0) + 1;
    await saveJson(INVALID_BET_PATH, invalidBet);
    if (invalidBet[guildId][userId] >= 2) {
      balance[guildId]?.[userId] && delete balance[guildId][userId];
      await saveJson(BALANCE_PATH, balance);
      delete invalidBet[guildId][userId];
      await saveJson(INVALID_BET_PATH, invalidBet);
      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle('🌸 靈魂的代價 🌸')
          .setDescription('你多次試圖用無效的賭注欺騙幽幽子，你的幽靈幣已被清空了哦！')
          .setColor('Red')],
        ephemeral: true,
      });
      return;
    }
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle('🌸 無效的賭注 🌸')
        .setDescription('賭注必須大於 0 哦～')
        .setColor('Red')],
      ephemeral: true,
    });
    return;
  }

  // 餘額檢查
  const userBalance = roundToTwoDecimals(balance[guildId]?.[userId] ?? 0);
  if (userBalance < bet) {
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle('🌸 幽靈幣不足 🌸')
        .setDescription(`你的幽靈幣只有 ${userBalance.toFixed(2)}，無法下注 ${bet.toFixed(2)} 哦～`)
        .setColor('Red')],
      ephemeral: true,
    });
    return;
  }

  // 檢查是否為賭徒
  const isGambler = userJobs[guildId]?.[userId]?.job === '賭徒';

  // 遊戲初始化
  const deck = createDeck().sort(() => Math.random() - 0.5);
  const playerCards = [deck.pop()!, deck.pop()!];
  const dealerCards = [deck.pop()!, deck.pop()!];
  balance[guildId] ??= {};
  balance[guildId][userId] = roundToTwoDecimals(userBalance - bet);
  await saveJson(BALANCE_PATH, balance);

  blackjackData[guildId] ??= {};
  blackjackData[guildId][userId] = {
    playerCards,
    dealerCards,
    deck,
    bet,
    gameStatus: 'ongoing',
    doubleDownUsed: false,
    isGambler,
  };
  await saveJson(BLACKJACK_PATH, blackjackData);

  const playerTotal = calculateHand(playerCards);
  if (playerTotal === 21) {
    blackjackData[guildId][userId].gameStatus = 'ended';
    await saveJson(BLACKJACK_PATH, blackjackData);
    const multiplier = isGambler ? 5 : 2.5;
    const reward = roundToTwoDecimals(bet * multiplier);
    balance[guildId][userId] += reward;
    await saveJson(BALANCE_PATH, balance);
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle('🌸 黑傑克！靈魂的勝利！🌸')
        .setDescription(`你的手牌：${JSON.stringify(playerCards)}\n幽幽子為你獻上 ${reward.toFixed(2)} 幽靈幣的祝福～`)
        .setColor('Gold')],
      ephemeral: true,
    });
    return;
  }

  // 遊戲嵌入與按鈕
  const startEmbed = new EmbedBuilder()
    .setTitle('🌸 幽幽子的21點遊戲開始！🌸')
    .setDescription(
      `你下注了 **${bet.toFixed(2)} 幽靈幣**\n\n你的初始手牌：${JSON.stringify(playerCards)} (總點數：${playerTotal})\n幽幽子的明牌：${dealerCards[0]}`
    )
    .setColor('#FFB6C1')
    .setFooter({ text: '選擇你的命運吧～' });

  // 按鈕標籤翻譯為中文，保留 customId 為英文以符合 Discord 慣例
  const hitBtn = new ButtonBuilder().setCustomId('hit').setLabel('抽牌').setStyle(ButtonStyle.Primary);
  const standBtn = new ButtonBuilder().setCustomId('stand').setLabel('停牌').setStyle(ButtonStyle.Danger);
  const doubleBtn = new ButtonBuilder().setCustomId('double').setLabel('雙倍下注').setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(hitBtn, standBtn, doubleBtn);

  const msg = await interaction.reply({ embeds: [startEmbed], components: [row], ephemeral: true, fetchReply: true });

  // 按鈕互動收集器
  const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 3 * 60 * 1000 });

  collector.on('collect', async btnInt => {
    if (btnInt.user.id !== userId) {
      await btnInt.reply({ content: '這不是你的遊戲哦～', ephemeral: true });
      return;
    }

    await btnInt.deferUpdate();

    const data = await loadJson<BlackjackData>(BLACKJACK_PATH);
    const bal = await loadJson<BalanceData>(BALANCE_PATH);
    const bj = data[guildId]?.[userId];

    if (!bj || bj.gameStatus === 'ended') {
      await btnInt.editReply({
        embeds: [new EmbedBuilder()
          .setTitle('🌸 遊戲已結束 🌸')
          .setDescription('這場遊戲已經結束了哦～')
          .setColor('Red')],
        components: [],
      });
      return;
    }

    if (btnInt.customId === 'hit') {
      bj.playerCards.push(bj.deck.pop()!);
      const total = calculateHand(bj.playerCards);
      if (total > 21) {
        bj.gameStatus = 'ended';
        await saveJson(BLACKJACK_PATH, data);
        await btnInt.editReply({
          embeds: [new EmbedBuilder()
            .setTitle('🌸 哎呀，靈魂爆掉了！🌸')
            .setDescription(`你的手牌：${JSON.stringify(bj.playerCards)}\n點數總計：${total}`)
            .setColor('Red')],
          components: [],
        });
        return;
      }
      if (total === 21) {
        bj.gameStatus = 'ended';
        const multiplier = bj.isGambler ? 5 : 2.5;
        const reward = roundToTwoDecimals(bj.bet * multiplier);
        bal[guildId][userId] += reward;
        await saveJson(BALANCE_PATH, bal);
        await saveJson(BLACKJACK_PATH, data);
        await btnInt.editReply({
          embeds: [new EmbedBuilder()
            .setTitle('🌸 黑傑克！靈魂的勝利！🌸')
            .setDescription(`你的手牌：${JSON.stringify(bj.playerCards)}\n幽幽子為你獻上 ${reward.toFixed(2)} 幽靈幣的祝福～`)
            .setColor('Gold')],
          components: [],
        });
        return;
      }
      await saveJson(BLACKJACK_PATH, data);
      await btnInt.editReply({
        embeds: [new EmbedBuilder()
          .setTitle('🌸 你抽了一張牌！🌸')
          .setDescription(`你的手牌：${JSON.stringify(bj.playerCards)}\n目前點數：${calculateHand(bj.playerCards)}`)
          .setColor('#FFB6C1')],
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
          hitBtn,
          standBtn,
          bj.doubleDownUsed ? doubleBtn.setDisabled(true) : doubleBtn
        )],
      });
    } else if (btnInt.customId === 'stand' || btnInt.customId === 'double') {
      let bet = bj.bet;
      if (btnInt.customId === 'double') {
        if (bj.doubleDownUsed) {
          await btnInt.editReply({
            embeds: [new EmbedBuilder()
              .setTitle('🌸 無法再次挑戰命運！🌸')
              .setDescription('你已經使用過雙倍下注了哦～')
              .setColor('Red')],
            components: [],
          });
          return;
        }
        if (bal[guildId][userId] < bet) {
          await btnInt.editReply({
            embeds: [new EmbedBuilder()
              .setTitle('🌸 嘻嘻，靈魂不夠喲～ 🌸')
              .setDescription(`你的幽靈幣只有 ${bal[guildId][userId].toFixed(2)}，不足以雙倍下注哦～`)
              .setColor('Red')],
            components: [row],
          });
          return;
        }
        bal[guildId][userId] = roundToTwoDecimals(bal[guildId][userId] - bet);
        bj.bet = roundToTwoDecimals(bet * 2);
        bj.doubleDownUsed = true;
        bj.playerCards.push(bj.deck.pop()!);
      }
      bj.gameStatus = 'ended';
      // 莊家輪
      while (calculateHand(bj.dealerCards) < 17) bj.dealerCards.push(bj.deck.pop()!);
      const playerTotal = calculateHand(bj.playerCards);
      const dealerTotal = calculateHand(bj.dealerCards);
      let resultEmbed = new EmbedBuilder();
      let reward = 0;
      const winMultiplier = bj.isGambler ? 4 : 2;
      if (dealerTotal > 21 || playerTotal > dealerTotal) {
        reward = roundToTwoDecimals(bj.bet * winMultiplier);
        bal[guildId][userId] += reward;
        resultEmbed
          .setTitle('🌸 靈魂的勝利！🌸')
          .setDescription(`你的手牌：${JSON.stringify(bj.playerCards)}\n幽幽子的手牌：${JSON.stringify(bj.dealerCards)}\n你贏得了 ${reward.toFixed(2)} 幽靈幣～`)
          .setColor('Gold');
      } else if (playerTotal === dealerTotal) {
        reward = roundToTwoDecimals(bj.bet);
        bal[guildId][userId] += reward;
        resultEmbed
          .setTitle('🌸 平手，靈魂的平衡～ 🌸')
          .setDescription(`你的手牌：${JSON.stringify(bj.playerCards)}\n幽幽子的手牌：${JSON.stringify(bj.dealerCards)}\n退還賭注：${reward.toFixed(2)} 幽靈幣`)
          .setColor('#FFB6C1');
      } else {
        resultEmbed
          .setTitle('🌸 殞地，幽幽子贏了！🌸')
          .setDescription(`你的手牌：${JSON.stringify(bj.playerCards)}\n幽幽子的手牌：${JSON.stringify(bj.dealerCards)}\n下次再來挑戰吧～`)
          .setColor('Red');
      }
      await saveJson(BALANCE_PATH, bal);
      await saveJson(BLACKJACK_PATH, data);
      await btnInt.editReply({ embeds: [resultEmbed], components: [] });
    }
  });

  collector.on('end', async () => {
    const data = await loadJson<BlackjackData>(BLACKJACK_PATH);
    if (data[guildId]?.[userId]?.gameStatus === 'ongoing') {
      const bal = await loadJson<BalanceData>(BALANCE_PATH);
      const bet = data[guildId][userId].bet;
      bal[guildId][userId] = roundToTwoDecimals(bal[guildId][userId] + bet);
      data[guildId][userId].gameStatus = 'ended';
      await saveJson(BALANCE_PATH, bal);
      await saveJson(BLACKJACK_PATH, data);
      try {
        await interaction.editReply({
          embeds: [new EmbedBuilder()
            .setTitle('🌸 遊戲超時，靈魂休息了～ 🌸')
            .setDescription(`時間到了，遊戲已結束。退還你的賭注 ${bet.toFixed(2)} 幽靈幣，下次再來挑戰幽幽子吧！`)
            .setColor('Blue')],
          components: [],
        });
      } catch (error) {
        console.error('編輯超時回應時發生錯誤：', error);
      }
    }
  });
}
